"""
Tests for the users / auth endpoints:
  POST   /api/auth/register/
  POST   /api/auth/login/
  GET    /api/auth/me/
  PATCH  /api/auth/me/
  DELETE /api/auth/me/delete/
  POST   /api/auth/verify-email/
  POST   /api/auth/resend-otp/
  POST   /api/auth/refresh/
  POST   /api/auth/google/
"""

import pytest
from datetime import timedelta

from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken

from apps.users.models import User
from tests.fixtures import ALL_PLANS, PLAN_CREDITS, REGISTER_PLAN_CASES, google_payload

pytestmark = pytest.mark.django_db


# ── Register ───────────────────────────────────────────────────────────────────

@pytest.mark.parametrize("plan,expected_credits", REGISTER_PLAN_CASES)
def test_register_creates_user_with_correct_plan_and_credits(anon_client, plan, expected_credits):
    payload = {
        "username":         f"newuser_{plan}",
        "email":            f"newuser_{plan}@test.com",
        "first_name":       "Test",
        "last_name":        "User",
        "password":         "StrongPass123!",
        "password_confirm": "StrongPass123!",
        "plan":             plan,
    }

    resp = anon_client.post("/api/auth/register/", payload)

    assert resp.status_code == 201
    user = User.objects.get(username=f"newuser_{plan}")
    assert user.user_plan.plan == plan
    assert user.user_plan.credits == expected_credits
    assert not user.is_email_verified


def test_register_password_mismatch_returns_400(anon_client):
    payload = {
        "username":         "mismatch_user",
        "email":            "mismatch@test.com",
        "password":         "StrongPass123!",
        "password_confirm": "Different123!",
    }
    resp = anon_client.post("/api/auth/register/", payload)
    assert resp.status_code == 400


def test_register_duplicate_username_returns_400(anon_client):
    payload = {
        "username":         "dup_user",
        "email":            "dup1@test.com",
        "password":         "StrongPass123!",
        "password_confirm": "StrongPass123!",
    }
    anon_client.post("/api/auth/register/", payload)

    payload["email"] = "dup2@test.com"
    resp = anon_client.post("/api/auth/register/", payload)
    assert resp.status_code == 400


# ── Email Verification ─────────────────────────────────────────────────────────

def test_verify_email_with_valid_otp(anon_client, user_unverified):
    otp = "123456"
    user_unverified.otp_code = otp
    user_unverified.otp_expires_at = timezone.now() + timedelta(minutes=15)
    user_unverified.save(update_fields=["otp_code", "otp_expires_at"])

    resp = anon_client.post("/api/auth/verify-email/", {
        "email": user_unverified.email, "otp_code": otp,
    })

    assert resp.status_code == 200
    user_unverified.refresh_from_db()
    assert user_unverified.is_email_verified
    assert user_unverified.otp_code is None


def test_verify_email_wrong_otp_returns_400(anon_client, user_unverified):
    user_unverified.otp_code = "123456"
    user_unverified.otp_expires_at = timezone.now() + timedelta(minutes=15)
    user_unverified.save(update_fields=["otp_code", "otp_expires_at"])

    resp = anon_client.post("/api/auth/verify-email/", {
        "email": user_unverified.email, "otp_code": "999999",
    })
    assert resp.status_code == 400


def test_verify_email_expired_otp_returns_400(anon_client, user_unverified):
    user_unverified.otp_code = "123456"
    user_unverified.otp_expires_at = timezone.now() - timedelta(minutes=1)
    user_unverified.save(update_fields=["otp_code", "otp_expires_at"])

    resp = anon_client.post("/api/auth/verify-email/", {
        "email": user_unverified.email, "otp_code": "123456",
    })
    assert resp.status_code == 400


def test_verify_email_already_verified_returns_400(anon_client, user_free):
    resp = anon_client.post("/api/auth/verify-email/", {
        "email": user_free.email, "otp_code": "000000",
    })
    assert resp.status_code == 400


# ── Resend OTP ─────────────────────────────────────────────────────────────────

def test_resend_otp_for_unverified_user(anon_client, user_unverified):
    resp = anon_client.post("/api/auth/resend-otp/", {"email": user_unverified.email})
    assert resp.status_code == 200


def test_resend_otp_for_already_verified_user_returns_400(anon_client, user_free):
    resp = anon_client.post("/api/auth/resend-otp/", {"email": user_free.email})
    assert resp.status_code == 400


def test_resend_otp_for_unknown_email_returns_400(anon_client):
    resp = anon_client.post("/api/auth/resend-otp/", {"email": "ghost@test.com"})
    assert resp.status_code == 400


# ── Login ──────────────────────────────────────────────────────────────────────

@pytest.mark.parametrize("plan", ALL_PLANS)
def test_login_returns_tokens_and_plan_data(anon_client, make_user, plan):
    user = make_user(plan=plan)

    resp = anon_client.post("/api/auth/login/", {
        "username": user.username,
        "password": "TestPass123!",
    })

    assert resp.status_code == 200
    assert "access" in resp.data
    assert "refresh" in resp.data
    assert resp.data["user"]["user_plan"]["plan"] == plan
    assert resp.data["user"]["user_plan"]["credits"] == PLAN_CREDITS[plan]


def test_login_unverified_email_is_blocked(anon_client, user_unverified):
    resp = anon_client.post("/api/auth/login/", {
        "username": user_unverified.username,
        "password": "TestPass123!",
    })
    assert resp.status_code == 400


def test_login_with_email_as_identifier(anon_client, user_free):
    """CustomTokenObtainPairSerializer accepts email in the username field."""
    resp = anon_client.post("/api/auth/login/", {
        "username": user_free.email,
        "password": "TestPass123!",
    })
    assert resp.status_code == 200


def test_login_with_email_is_case_insensitive(anon_client, user_free):
    resp = anon_client.post("/api/auth/login/", {
        "username": user_free.email.upper(),
        "password": "TestPass123!",
    })
    assert resp.status_code == 200


def test_login_wrong_password_returns_401(anon_client, user_free):
    resp = anon_client.post("/api/auth/login/", {
        "username": user_free.username,
        "password": "WrongPassword!",
    })
    assert resp.status_code == 401


def test_login_password_blocked_for_google_only_account(anon_client, make_user):
    user = make_user(email="google.only@test.com")
    user.google_id = "google-sub-999"
    user.set_unusable_password()
    user.save()

    resp = anon_client.post("/api/auth/login/", {
        "username": user.email,
        "password": "AnyPassword123!",
    })

    assert resp.status_code == 400
    assert resp.data["code"][0] == "google_account"


# ── Google Sign-In ─────────────────────────────────────────────────────────────

def test_google_auth_creates_new_user_and_redirects_to_plan_selection(anon_client, mock_google_verify):
    mock_google_verify(google_payload("newbie@test.com"))

    resp = anon_client.post("/api/auth/google/", {"credential": "fake-token"})

    assert resp.status_code == 200
    assert resp.data["is_new_user"] is True
    assert "access" in resp.data and "refresh" in resp.data

    user = User.objects.get(email="newbie@test.com")
    assert user.google_id == "google-sub-123"
    assert user.avatar_url == "https://lh3.googleusercontent.com/a/photo.jpg"
    assert user.is_email_verified is True
    assert not user.has_usable_password()
    assert user.user_plan.plan == "free"
    assert user.user_plan.credits == PLAN_CREDITS["free"]


def test_google_auth_existing_google_user_logs_in_directly(anon_client, make_user, mock_google_verify):
    user = make_user(email="already@test.com")
    user.google_id = "google-sub-existing"
    user.save()
    mock_google_verify(google_payload("already@test.com", sub="google-sub-existing"))

    resp = anon_client.post("/api/auth/google/", {"credential": "fake-token"})

    assert resp.status_code == 200
    assert resp.data["is_new_user"] is False
    assert resp.data["user"]["email"] == "already@test.com"


def test_google_auth_existing_password_account_requires_link_confirmation(
    anon_client, user_free, mock_google_verify
):
    mock_google_verify(google_payload(user_free.email, sub="google-sub-new"))

    resp = anon_client.post("/api/auth/google/", {"credential": "fake-token"})

    assert resp.status_code == 200
    assert resp.data["link_required"] is True
    assert resp.data["email"] == user_free.email

    user_free.refresh_from_db()
    assert not user_free.google_id  # not linked yet


def test_google_auth_confirm_link_links_existing_account(anon_client, user_free, mock_google_verify):
    mock_google_verify(google_payload(user_free.email, sub="google-sub-new"))

    resp = anon_client.post("/api/auth/google/", {
        "credential": "fake-token",
        "confirm_link": True,
    })

    assert resp.status_code == 200
    assert "link_required" not in resp.data
    assert "access" in resp.data

    user_free.refresh_from_db()
    assert user_free.google_id == "google-sub-new"
    assert user_free.has_usable_password()  # password login keeps working


def test_google_auth_invalid_token_returns_400(anon_client, mock_google_verify):
    mock_google_verify(ValueError("bad token"))

    resp = anon_client.post("/api/auth/google/", {"credential": "tampered"})

    assert resp.status_code == 400
    assert "ValueError" not in str(resp.data)
    assert "bad token" not in str(resp.data)


def test_google_auth_unverified_google_email_returns_400(anon_client, mock_google_verify):
    mock_google_verify(google_payload("unverified@test.com", email_verified=False))

    resp = anon_client.post("/api/auth/google/", {"credential": "fake-token"})

    assert resp.status_code == 400


# ── /me endpoint ───────────────────────────────────────────────────────────────

def test_me_unauthenticated_returns_401(anon_client):
    resp = anon_client.get("/api/auth/me/")
    assert resp.status_code == 401


@pytest.mark.parametrize("plan", ALL_PLANS)
def test_me_returns_correct_plan_for_each_user_type(auth_client, make_user, plan):
    user = make_user(plan=plan)
    resp = auth_client(user).get("/api/auth/me/")

    assert resp.status_code == 200
    assert resp.data["username"] == user.username
    assert resp.data["user_plan"]["plan"] == plan


def test_me_patch_updates_name(auth_client, user_free):
    resp = auth_client(user_free).patch("/api/auth/me/", {
        "first_name": "Victor", "last_name": "Silva",
    })

    assert resp.status_code == 200
    assert resp.data["first_name"] == "Victor"
    assert resp.data["last_name"] == "Silva"


def test_me_patch_unauthenticated_returns_401(anon_client):
    resp = anon_client.patch("/api/auth/me/", {"first_name": "Hacker"})
    assert resp.status_code == 401


# ── Delete Account ─────────────────────────────────────────────────────────────

def test_delete_account_unauthenticated_returns_401(anon_client):
    resp = anon_client.delete("/api/auth/me/delete/")
    assert resp.status_code == 401


@pytest.mark.parametrize("plan", ALL_PLANS)
def test_delete_account_removes_user_from_database(auth_client, make_user, plan):
    user = make_user(plan=plan)
    user_id = user.pk

    resp = auth_client(user).delete("/api/auth/me/delete/")

    assert resp.status_code == 204
    assert not User.objects.filter(pk=user_id).exists()


# ── Token Refresh ──────────────────────────────────────────────────────────────

def test_token_refresh_returns_new_access_token(anon_client, user_free):
    refresh_token = str(RefreshToken.for_user(user_free))
    resp = anon_client.post("/api/auth/refresh/", {"refresh": refresh_token})

    assert resp.status_code == 200
    assert "access" in resp.data


def test_token_refresh_with_invalid_token_returns_401(anon_client):
    resp = anon_client.post("/api/auth/refresh/", {"refresh": "not.a.valid.token"})
    assert resp.status_code == 401
