"""Seed system exercises, a super admin, a demo studio with owner."""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from exercises.models import Exercise
from studios.models import Studio

User = get_user_model()

SYSTEM_EXERCISES = [
    {"name": "Standing Roll Down", "category": "WARMUP", "difficulty": "BEGINNER",
     "muscle_groups": ["spine", "hamstrings"], "duration_seconds": 60,
     "instructions": "From standing, slowly roll spine down vertebra by vertebra reaching toward the floor.",
     "safety_notes": "Bend knees if hamstrings are tight."},
    {"name": "Cat Cow", "category": "WARMUP", "difficulty": "BEGINNER",
     "muscle_groups": ["spine", "core"], "duration_seconds": 45,
     "instructions": "On hands and knees, alternate arching and rounding the spine with breath.",
     "safety_notes": "Move slowly, keep wrists aligned under shoulders."},
    {"name": "Hundred", "category": "CORE", "difficulty": "INTERMEDIATE",
     "muscle_groups": ["core", "abdominals"], "duration_seconds": 60,
     "instructions": "Lying supine, head/shoulders curled, legs in tabletop or extended, pulse arms 100 times.",
     "safety_notes": "Lower head if neck strains."},
    {"name": "Roll Up", "category": "CORE", "difficulty": "INTERMEDIATE",
     "muscle_groups": ["abdominals", "spine"], "duration_seconds": 50,
     "instructions": "From supine, slowly articulate spine to seated, reach forward, then roll back down.",
     "safety_notes": "Bend knees if needed."},
    {"name": "Single Leg Stretch", "category": "CORE", "difficulty": "BEGINNER",
     "muscle_groups": ["core", "hip flexors"], "duration_seconds": 60,
     "instructions": "Lying supine with head curled, alternate drawing one knee to chest while extending the other leg.",
     "safety_notes": "Lower head if neck fatigues."},
    {"name": "Double Leg Stretch", "category": "CORE", "difficulty": "INTERMEDIATE",
     "muscle_groups": ["core", "shoulders"], "duration_seconds": 50,
     "instructions": "Lying supine, extend arms overhead and legs out, then circle arms and pull knees in.",
     "safety_notes": "Maintain neutral pelvis."},
    {"name": "Saw", "category": "FLEXIBILITY", "difficulty": "INTERMEDIATE",
     "muscle_groups": ["spine", "obliques", "hamstrings"], "duration_seconds": 60,
     "instructions": "Seated, legs wide, rotate torso and reach opposite hand toward opposite foot.",
     "safety_notes": "Length over depth — don't force."},
    {"name": "Spine Stretch Forward", "category": "FLEXIBILITY", "difficulty": "BEGINNER",
     "muscle_groups": ["spine", "hamstrings"], "duration_seconds": 50,
     "instructions": "Seated tall, legs extended wide, articulate spine forward reaching arms long.",
     "safety_notes": "Bend knees slightly if needed."},
    {"name": "Swan Prep", "category": "STRENGTH", "difficulty": "BEGINNER",
     "muscle_groups": ["back", "glutes"], "duration_seconds": 45,
     "instructions": "Prone, hands under shoulders, lift chest using back extensors.",
     "safety_notes": "Keep elbows soft, gaze forward."},
    {"name": "Side Kick Series", "category": "LOWER_BODY", "difficulty": "INTERMEDIATE",
     "muscle_groups": ["glutes", "obliques"], "duration_seconds": 60,
     "instructions": "Lying on side, supported on forearm, lift top leg and pulse front/back.",
     "safety_notes": "Stabilize torso, avoid rolling hips."},
    {"name": "Mat Bridge", "category": "STRENGTH", "difficulty": "BEGINNER",
     "muscle_groups": ["glutes", "hamstrings", "core"], "duration_seconds": 45,
     "instructions": "Supine, knees bent, lift hips articulating through spine.",
     "safety_notes": "Drive through heels, don't overarch."},
    {"name": "Plank Hold", "category": "STRENGTH", "difficulty": "INTERMEDIATE",
     "muscle_groups": ["core", "shoulders"], "duration_seconds": 45,
     "instructions": "Hold forearm or full plank, body in one long line.",
     "safety_notes": "Don't let hips sag or pike."},
    {"name": "Side Plank", "category": "BALANCE", "difficulty": "INTERMEDIATE",
     "muscle_groups": ["obliques", "shoulders"], "duration_seconds": 40,
     "instructions": "Forearm or hand support, body lifted in a side line.",
     "safety_notes": "Stack shoulders over support."},
    {"name": "Teaser Prep", "category": "CORE", "difficulty": "ADVANCED",
     "muscle_groups": ["core", "hip flexors"], "duration_seconds": 50,
     "instructions": "From supine, roll up into V-sit with arms and legs reaching long.",
     "safety_notes": "Modify by keeping knees bent."},
    {"name": "Mermaid Stretch", "category": "FLEXIBILITY", "difficulty": "BEGINNER",
     "muscle_groups": ["obliques", "lats"], "duration_seconds": 45,
     "instructions": "Seated with legs folded to one side, reach top arm overhead in side bend.",
     "safety_notes": "Lengthen rather than crunching."},
    {"name": "Single Leg Circles", "category": "BALANCE", "difficulty": "BEGINNER",
     "muscle_groups": ["hip flexors", "core"], "duration_seconds": 60,
     "instructions": "Supine, one leg extended to ceiling, circle controlled in both directions.",
     "safety_notes": "Keep pelvis stable."},
    {"name": "Swimming", "category": "STRENGTH", "difficulty": "INTERMEDIATE",
     "muscle_groups": ["back", "glutes"], "duration_seconds": 45,
     "instructions": "Prone, alternate opposite arm/leg lifts in a quick swimming rhythm.",
     "safety_notes": "Lengthen, don't crunch lower back."},
    {"name": "Child's Pose", "category": "COOLDOWN", "difficulty": "BEGINNER",
     "muscle_groups": ["back", "hips"], "duration_seconds": 60,
     "instructions": "Kneeling, sit hips toward heels, fold forward, arms long or by sides.",
     "safety_notes": "Place towel under hips if knees ache."},
    {"name": "Supine Twist", "category": "COOLDOWN", "difficulty": "BEGINNER",
     "muscle_groups": ["spine", "obliques"], "duration_seconds": 60,
     "instructions": "Supine, drop bent knees to one side, arms wide, gaze opposite.",
     "safety_notes": "Allow gravity to do the work."},
    {"name": "Standing Forward Fold", "category": "FLEXIBILITY", "difficulty": "BEGINNER",
     "muscle_groups": ["hamstrings", "spine"], "duration_seconds": 45,
     "instructions": "Standing, hinge from hips and fold forward, hands to floor or shins.",
     "safety_notes": "Bend knees as needed."},
    {"name": "Roll Like a Ball", "category": "CORE", "difficulty": "INTERMEDIATE",
     "muscle_groups": ["core", "spine"], "duration_seconds": 45,
     "instructions": "Balance on sit bones, rock back to shoulder blades and return without using momentum.",
     "safety_notes": "Avoid if pregnant or back-sensitive."},
    {"name": "Pilates Push Up", "category": "UPPER_BODY", "difficulty": "INTERMEDIATE",
     "muscle_groups": ["chest", "triceps", "core"], "duration_seconds": 45,
     "instructions": "From plank, lower with elbows hugging ribs, then press up.",
     "safety_notes": "Drop to knees for modification."},
    {"name": "Scissor", "category": "CORE", "difficulty": "INTERMEDIATE",
     "muscle_groups": ["core", "hamstrings"], "duration_seconds": 50,
     "instructions": "Supine, legs to ceiling, scissor switch with hands lightly supporting one leg.",
     "safety_notes": "Keep pelvis grounded."},
    {"name": "Glute Bridge March", "category": "LOWER_BODY", "difficulty": "BEGINNER",
     "muscle_groups": ["glutes", "core"], "duration_seconds": 45,
     "instructions": "From bridge, march knees alternately without dropping hips.",
     "safety_notes": "Maintain level pelvis."},
    {"name": "Seated Spinal Twist", "category": "COOLDOWN", "difficulty": "BEGINNER",
     "muscle_groups": ["spine", "obliques"], "duration_seconds": 40,
     "instructions": "Seated tall, gently rotate torso, one hand behind, one across knee.",
     "safety_notes": "Grow tall before twisting."},
]


class Command(BaseCommand):
    help = "Seed system exercises, a super admin, and a demo studio."

    def handle(self, *args, **options):
        # Super admin
        sa, created = User.objects.get_or_create(
            email="admin@fitstudio.ai",
            defaults={
                "username": "admin@fitstudio.ai",
                "first_name": "Super",
                "last_name": "Admin",
                "role": User.ROLE_SUPER_ADMIN,
                "is_staff": True,
                "is_superuser": True,
            },
        )
        if created:
            sa.set_password("Admin@12345")
            sa.save()
            self.stdout.write(self.style.SUCCESS("Created super admin admin@fitstudio.ai / Admin@12345"))
        else:
            self.stdout.write("Super admin already exists.")

        # Demo studio
        demo_studio, created = Studio.objects.get_or_create(
            name="Lumen Pilates",
            defaults={
                "tagline": "Mindful movement, modern minds.",
                "brand_color": "#264D3B",
            },
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f"Created demo studio '{demo_studio.name}'"))

        # Demo owner
        owner, created = User.objects.get_or_create(
            email="owner@lumen.studio",
            defaults={
                "username": "owner@lumen.studio",
                "first_name": "Maya",
                "last_name": "Okafor",
                "role": User.ROLE_OWNER,
                "studio": demo_studio,
            },
        )
        if created:
            owner.set_password("Owner@12345")
            owner.studio = demo_studio
            owner.save()
            self.stdout.write(self.style.SUCCESS("Created demo owner owner@lumen.studio / Owner@12345"))
        else:
            self.stdout.write("Demo owner already exists.")

        # System exercises (studio = None)
        added = 0
        for spec in SYSTEM_EXERCISES:
            obj, was_new = Exercise.objects.get_or_create(
                name=spec["name"], studio=None,
                defaults={
                    "category": spec["category"],
                    "difficulty": spec["difficulty"],
                    "muscle_groups": spec["muscle_groups"],
                    "instructions": spec["instructions"],
                    "safety_notes": spec.get("safety_notes", ""),
                    "duration_seconds": spec.get("duration_seconds", 45),
                    "is_approved": True,
                },
            )
            if was_new:
                added += 1
        self.stdout.write(self.style.SUCCESS(f"System exercises ready ({added} new, {Exercise.objects.filter(studio__isnull=True).count()} total)."))
