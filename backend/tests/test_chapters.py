"""
Tests for the chapters endpoints:
  GET    /api/projects/<uuid>/chapters/
  POST   /api/projects/<uuid>/chapters/
  GET    /api/chapters/<uuid>/
  PATCH  /api/chapters/<uuid>/
  DELETE /api/chapters/<uuid>/
  POST   /api/chapters/import/

Word limits per plan:
  free    →  5 000 words
  basic   → 15 000 words
  premium → unlimited
"""

import pytest
from io import BytesIO

from apps.chapters.models import Chapter
from tests.fixtures import ALL_PLANS, CHAPTER_WORD_LIMIT_CASES

pytestmark = pytest.mark.django_db


# ── List ───────────────────────────────────────────────────────────────────────

def test_list_chapters_unauthenticated_returns_401(anon_client, user_free, make_project):
    project = make_project(user_free)
    resp = anon_client.get(f"/api/projects/{project.pk}/chapters/")
    assert resp.status_code == 401


@pytest.mark.parametrize("plan", ALL_PLANS)
def test_list_chapters_returns_all_chapters_for_own_project(
    auth_client, make_user, make_project, make_chapter, plan
):
    user = make_user(plan=plan)
    project = make_project(user)
    make_chapter(project, number=1, title="Cap 1")
    make_chapter(project, number=2, title="Cap 2")

    resp = auth_client(user).get(f"/api/projects/{project.pk}/chapters/")

    assert resp.status_code == 200
    assert len(resp.data) == 2  # no pagination on chapter list


def test_list_chapters_from_another_users_project_returns_empty(
    auth_client, user_free, other_user, make_project, make_chapter
):
    """
    get_queryset filters by project__user, so an intruder gets an empty
    list rather than a 404 — the project existence is never confirmed.
    """
    project = make_project(other_user)
    make_chapter(project, number=1)

    resp = auth_client(user_free).get(f"/api/projects/{project.pk}/chapters/")

    assert resp.status_code == 200
    assert resp.data == []


# ── Create ─────────────────────────────────────────────────────────────────────

def test_create_chapter_unauthenticated_returns_401(anon_client, user_free, make_project):
    project = make_project(user_free)
    resp = anon_client.post(
        f"/api/projects/{project.pk}/chapters/",
        {"project": str(project.pk), "number": 1, "content": "hello"},
    )
    assert resp.status_code == 401


@pytest.mark.parametrize("plan", ALL_PLANS)
def test_create_chapter_within_word_limit_succeeds(
    auth_client, make_user, make_project, plan
):
    user = make_user(plan=plan)
    project = make_project(user)

    resp = auth_client(user).post(
        f"/api/projects/{project.pk}/chapters/",
        {"project": str(project.pk), "number": 1, "title": "Cap 1", "content": "palavra " * 100},
        format="json",
    )

    assert resp.status_code == 201
    assert resp.data["number"] == 1


def test_create_chapter_in_another_users_project_returns_404(
    auth_client, user_free, other_user, make_project
):
    """perform_create uses get_object_or_404(Project, user=request.user)."""
    project = make_project(other_user)

    resp = auth_client(user_free).post(
        f"/api/projects/{project.pk}/chapters/",
        {"project": str(project.pk), "number": 1, "content": "hack"},
        format="json",
    )

    assert resp.status_code == 404


# ── Word limit by plan ─────────────────────────────────────────────────────────

@pytest.mark.parametrize("plan,word_count,expected_status", CHAPTER_WORD_LIMIT_CASES)
def test_chapter_word_limit_enforced_by_plan(
    auth_client, make_user, make_project, plan, word_count, expected_status
):
    user = make_user(plan=plan)
    project = make_project(user)
    content = "palavra " * word_count

    resp = auth_client(user).post(
        f"/api/projects/{project.pk}/chapters/",
        {"project": str(project.pk), "number": 1, "content": content},
        format="json",
    )

    assert resp.status_code == expected_status


# ── Unique number constraint ───────────────────────────────────────────────────

def test_duplicate_chapter_number_in_same_project_returns_400(
    auth_client, user_free, make_project, make_chapter
):
    project = make_project(user_free)
    make_chapter(project, number=1)

    resp = auth_client(user_free).post(
        f"/api/projects/{project.pk}/chapters/",
        {"project": str(project.pk), "number": 1, "content": "Duplicate"},
        format="json",
    )

    assert resp.status_code == 400


def test_same_chapter_number_in_different_projects_is_allowed(
    auth_client, user_free, make_project, make_chapter
):
    project_a = make_project(user_free, title="Project A")
    project_b = make_project(user_free, title="Project B")
    make_chapter(project_a, number=1)

    resp = auth_client(user_free).post(
        f"/api/projects/{project_b.pk}/chapters/",
        {"project": str(project_b.pk), "number": 1, "content": "OK"},
        format="json",
    )

    assert resp.status_code == 201


# ── Retrieve / Update / Delete ─────────────────────────────────────────────────

@pytest.mark.parametrize("plan", ALL_PLANS)
def test_get_own_chapter_returns_200(auth_client, make_user, make_project, make_chapter, plan):
    user = make_user(plan=plan)
    project = make_project(user)
    chapter = make_chapter(project, number=1, title="Capítulo Um")

    resp = auth_client(user).get(f"/api/chapters/{chapter.pk}/")

    assert resp.status_code == 200
    assert resp.data["title"] == "Capítulo Um"


def test_get_chapter_from_another_user_returns_404(
    auth_client, user_free, other_user, make_project, make_chapter
):
    project = make_project(other_user)
    chapter = make_chapter(project, number=1)

    resp = auth_client(user_free).get(f"/api/chapters/{chapter.pk}/")

    assert resp.status_code == 404


def test_get_chapter_unauthenticated_returns_401(anon_client, user_free, make_project, make_chapter):
    project = make_project(user_free)
    chapter = make_chapter(project, number=1)
    resp = anon_client.get(f"/api/chapters/{chapter.pk}/")
    assert resp.status_code == 401


def test_patch_own_chapter_updates_title(auth_client, user_free, make_project, make_chapter):
    project = make_project(user_free)
    chapter = make_chapter(project, number=1, title="Old")

    resp = auth_client(user_free).patch(f"/api/chapters/{chapter.pk}/", {"title": "New"})

    assert resp.status_code == 200
    assert resp.data["title"] == "New"


def test_patch_chapter_from_another_user_returns_404(
    auth_client, user_free, other_user, make_project, make_chapter
):
    project = make_project(other_user)
    chapter = make_chapter(project, number=1, title="Original")

    resp = auth_client(user_free).patch(f"/api/chapters/{chapter.pk}/", {"title": "Hacked"})

    assert resp.status_code == 404
    chapter.refresh_from_db()
    assert chapter.title == "Original"


def test_delete_own_chapter_removes_it(auth_client, user_free, make_project, make_chapter):
    project = make_project(user_free)
    chapter = make_chapter(project, number=1)
    chapter_id = chapter.pk

    resp = auth_client(user_free).delete(f"/api/chapters/{chapter.pk}/")

    assert resp.status_code == 204
    assert not Chapter.objects.filter(pk=chapter_id).exists()


def test_delete_chapter_from_another_user_returns_404(
    auth_client, user_free, other_user, make_project, make_chapter
):
    project = make_project(other_user)
    chapter = make_chapter(project, number=1)

    resp = auth_client(user_free).delete(f"/api/chapters/{chapter.pk}/")

    assert resp.status_code == 404
    assert Chapter.objects.filter(pk=chapter.pk).exists()


# ── Import ─────────────────────────────────────────────────────────────────────

def test_import_chapter_unauthenticated_returns_401(anon_client, user_free, make_project):
    project = make_project(user_free)
    f = BytesIO(b"Some text.")
    f.name = "chapter.txt"

    resp = anon_client.post(
        "/api/chapters/import/",
        {"project_id": str(project.pk), "file": f},
        format="multipart",
    )

    assert resp.status_code == 401


@pytest.mark.parametrize("plan", ALL_PLANS)
def test_import_txt_chapter_succeeds_for_all_plans(
    auth_client, make_user, make_project, monkeypatch, plan
):
    user = make_user(plan=plan)
    project = make_project(user)
    monkeypatch.setattr(
        "apps.chapters.serializers.extract_text_from_file",
        lambda _file: "palavra " * 100,
    )
    f = BytesIO(b"ignored by mock")
    f.name = "chapter.txt"

    resp = auth_client(user).post(
        "/api/chapters/import/",
        {"project_id": str(project.pk), "file": f},
        format="multipart",
    )

    assert resp.status_code == 201
    assert resp.data["number"] == 1


@pytest.mark.parametrize("plan,word_count,expected_status", CHAPTER_WORD_LIMIT_CASES)
def test_import_chapter_word_limit_by_plan(
    auth_client, make_user, make_project, monkeypatch, plan, word_count, expected_status
):
    user = make_user(plan=plan)
    project = make_project(user)
    monkeypatch.setattr(
        "apps.chapters.serializers.extract_text_from_file",
        lambda _file: "palavra " * word_count,
    )
    f = BytesIO(b"ignored")
    f.name = "chapter.txt"

    resp = auth_client(user).post(
        "/api/chapters/import/",
        {"project_id": str(project.pk), "file": f},
        format="multipart",
    )

    assert resp.status_code == expected_status


def test_import_chapter_into_another_users_project_returns_400(
    auth_client, user_free, other_user, make_project, monkeypatch
):
    """ChapterImportSerializer validates ownership → 400, not 404."""
    project = make_project(other_user)
    monkeypatch.setattr(
        "apps.chapters.serializers.extract_text_from_file",
        lambda _file: "some text",
    )
    f = BytesIO(b"text")
    f.name = "ch.txt"

    resp = auth_client(user_free).post(
        "/api/chapters/import/",
        {"project_id": str(project.pk), "file": f},
        format="multipart",
    )

    assert resp.status_code == 400


def test_import_chapter_sequential_numbering(
    auth_client, user_free, make_project, make_chapter, monkeypatch
):
    """Imported chapter receives the next sequential number."""
    project = make_project(user_free)
    make_chapter(project, number=1)
    make_chapter(project, number=2)
    monkeypatch.setattr(
        "apps.chapters.serializers.extract_text_from_file",
        lambda _file: "word " * 50,
    )
    f = BytesIO(b"ignored")
    f.name = "ch.txt"

    resp = auth_client(user_free).post(
        "/api/chapters/import/",
        {"project_id": str(project.pk), "file": f},
        format="multipart",
    )

    assert resp.status_code == 201
    assert resp.data["number"] == 3
