##Restore the Database
1. Copy `barakashop_backup.dump` from `/Database/` to your system.
2. Open the terminal and run:

pg_restore -U postgres -d barakashop -F c /path/to/barakashop_backup.dump

