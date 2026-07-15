import os
pending_dir = "/mnt/ExtraStorage/Project-Files/session-2026/procare/ecomm/procare-mail/july7/unzipped/Pending"
for root, dirs, files in os.walk(pending_dir):
    for f in files:
        if f.lower().endswith(('.jpg', '.jpeg', '.png', '.cr3')):
            print(os.path.join(root, f))
