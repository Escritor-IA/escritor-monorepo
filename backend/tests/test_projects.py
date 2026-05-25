"""
Tests for the projects endpoints:
  GET    /api/projects/
  POST   /api/projects/
  GET    /api/projects/<uuid>/
  PATCH  /api/projects/<uuid>/
  DELETE /api/projects/<uuid>/
"""

import pytest

from apps.projects.models import Project
from tests.fixtures import ALL_PLANS

pytestmark = pytest.mark.django_db


# ── List ───────────────────────────────────────────────────────────────────────

def test_list_projects_unauthenticated_returns_401(anon_client):
    resp = anon_client.get("/api/projects/")
    assert resp.status_code == 401


@pytest.mark.parametrize("plan", ALL_PLANS)
def test_list_projects_returns_only_the_requesting_users_projects(
    auth_client, make_user, make_project, other_user, plan
):
    user = make_user(plan=plan)
    make_project(user, title="Mine")
    make_project(other_user, title="Not Mine")

    resp = auth_client(user).get("/api/projects/")

    assert resp.status_code == 200
    titles = [p["title"] for p in resp.data["results"]]
    assert "Mine" in titles
    assert "Not Mine" not in titles


def test_list_projects_empty_for_new_user(auth_client, user_free):
    resp = auth_client(user_free).get("/api/projects/")

    assert resp.status_code == 200
    assert resp.data["count"] == 0


# ── Create ─────────────────────────────────────────────────────────────────────

def test_create_project_unauthenticated_returns_401(anon_client):
    resp = anon_client.post("/api/projects/", {"title": "Unauthorized"})
    assert resp.status_code == 401


@pytest.mark.parametrize("plan", ALL_PLANS)
def test_create_project_succeeds_for_all_plans(auth_client, make_user, plan):
    user = make_user(plan=plan)
    payload = {
        "title":    f"Project by {plan}",
        "synopsis": "Uma sinopse qualquer.",
        "genres":   ["fantasy", "adventure"],
    }

    resp = auth_client(user).post("/api/projects/", payload, format="json")

    assert resp.status_code == 201
    assert resp.data["title"] == f"Project by {plan}"
    assert resp.data["chapters_count"] == 0


def test_create_project_requires_title(auth_client, user_free):
    resp = auth_client(user_free).post("/api/projects/", {"synopsis": "no title"}, format="json")
    assert resp.status_code == 400


# ── Retrieve ───────────────────────────────────────────────────────────────────

@pytest.mark.parametrize("plan", ALL_PLANS)
def test_get_own_project_returns_200(auth_client, make_user, make_project, plan):
    user = make_user(plan=plan)
    project = make_project(user, title="My Book")

    resp = auth_client(user).get(f"/api/projects/{project.pk}/")

    assert resp.status_code == 200
    assert resp.data["title"] == "My Book"


def test_get_another_users_project_returns_404(auth_client, user_free, other_user, make_project):
    project = make_project(other_user)

    resp = auth_client(user_free).get(f"/api/projects/{project.pk}/")

    assert resp.status_code == 404


def test_get_project_unauthenticated_returns_401(anon_client, user_free, make_project):
    project = make_project(user_free)
    resp = anon_client.get(f"/api/projects/{project.pk}/")
    assert resp.status_code == 401


# ── Update (PATCH) ─────────────────────────────────────────────────────────────

@pytest.mark.parametrize("plan", ALL_PLANS)
def test_patch_own_project_updates_fields(auth_client, make_user, make_project, plan):
    user = make_user(plan=plan)
    project = make_project(user, title="Old Title")

    resp = auth_client(user).patch(f"/api/projects/{project.pk}/", {"title": "New Title"})

    assert resp.status_code == 200
    assert resp.data["title"] == "New Title"
    project.refresh_from_db()
    assert project.title == "New Title"


def test_patch_another_users_project_returns_404(
    auth_client, user_free, other_user, make_project
):
    project = make_project(other_user, title="Original")

    resp = auth_client(user_free).patch(f"/api/projects/{project.pk}/", {"title": "Hacked"})

    assert resp.status_code == 404
    project.refresh_from_db()
    assert project.title == "Original"  # title must be unchanged


def test_patch_project_unauthenticated_returns_401(anon_client, user_free, make_project):
    project = make_project(user_free)
    resp = anon_client.patch(f"/api/projects/{project.pk}/", {"title": "Hack"})
    assert resp.status_code == 401


# ── Archive status ─────────────────────────────────────────────────────────────

@pytest.mark.parametrize("plan", ALL_PLANS)
def test_archive_project_by_plan(auth_client, make_user, make_project, plan):
    user = make_user(plan=plan)
    project = make_project(user)

    resp = auth_client(user).patch(f"/api/projects/{project.pk}/", {"status": "archived"})

    assert resp.status_code == 200
    assert resp.data["status"] == "archived"


# ── Delete ─────────────────────────────────────────────────────────────────────

@pytest.mark.parametrize("plan", ALL_PLANS)
def test_delete_own_project_removes_it(auth_client, make_user, make_project, plan):
    user = make_user(plan=plan)
    project = make_project(user)
    project_id = project.pk

    resp = auth_client(user).delete(f"/api/projects/{project.pk}/")

    assert resp.status_code == 204
    assert not Project.objects.filter(pk=project_id).exists()


def test_delete_another_users_project_returns_404(
    auth_client, user_free, other_user, make_project
):
    project = make_project(other_user)

    resp = auth_client(user_free).delete(f"/api/projects/{project.pk}/")

    assert resp.status_code == 404
    assert Project.objects.filter(pk=project.pk).exists()  # project must survive


def test_delete_project_unauthenticated_returns_401(anon_client, user_free, make_project):
    project = make_project(user_free)
    resp = anon_client.delete(f"/api/projects/{project.pk}/")
    assert resp.status_code == 401
