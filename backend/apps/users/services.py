from .models import UserPlan

PLAN_INITIAL_CREDITS = {
    "free": 10,
    "basic": 60,
    "premium": 150,
}


def create_default_user_plan(user):
    return UserPlan.objects.create(user=user, plan="free", credits=PLAN_INITIAL_CREDITS["free"])
