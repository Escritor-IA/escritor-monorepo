from django.core.management.base import BaseCommand

from apps.users.models import UserPlan
from apps.users.plans import get_plan_limits


class Command(BaseCommand):
    help = "Reset monthly credits for all user plans according to their current plan tier."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be reset without making changes.",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        plans = UserPlan.objects.select_related("user").all()
        count = 0

        for plan in plans:
            old_credits = plan.credits
            new_credits = get_plan_limits(plan.plan)["credits_monthly"]
            self.stdout.write(
                f"  {plan.user.email} [{plan.plan}]: {old_credits} → {new_credits}"
                + (" (dry-run)" if dry_run else "")
            )
            if not dry_run:
                plan.reset_credits()
            count += 1

        label = "Simulação concluída" if dry_run else "Reset concluído"
        self.stdout.write(self.style.SUCCESS(f"{label}: {count} planos processados."))
