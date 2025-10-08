-- Drop old tables if they exist
DROP TABLE IF EXISTS device_apps;
DROP TABLE IF EXISTS devices;
DROP TABLE IF EXISTS applications;

-- Devices table
CREATE TABLE IF NOT EXISTS devices (
  device_id TEXT PRIMARY KEY,
  hostname TEXT NOT NULL,
  username TEXT NOT NULL,
  department TEXT NOT NULL,
  os TEXT NOT NULL,
  os_version TEXT NOT NULL,
  last_seen DATE,
  is_encrypted INTEGER NOT NULL CHECK(is_encrypted IN (0,1)),
  auto_lock_enabled INTEGER NOT NULL CHECK(auto_lock_enabled IN (0,1)),
  needs_is_upgrade INTEGER NOT NULL CHECK(needs_is_upgrade IN (0,1))
);

-- Applications catalog
CREATE TABLE IF NOT EXISTS applications (
  app_id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  vendor TEXT,
  category TEXT,
  allowed INTEGER NOT NULL CHECK(allowed IN (0,1))
);

-- Installed applications on devices
CREATE TABLE IF NOT EXISTS device_apps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id TEXT NOT NULL,
  app_id INTEGER NOT NULL,
  app_version TEXT NOT NULL,
  install_date DATE,
  last_update DATE,
  needs_update INTEGER NOT NULL CHECK(needs_update IN (0,1)),
  FOREIGN KEY (device_id) REFERENCES devices(device_id),
  FOREIGN KEY (app_id) REFERENCES applications(app_id)
);

-- Applications list (broader, mixed allowed/unallowed)
INSERT INTO applications (name, vendor, category, allowed) VALUES
  ('Microsoft Office', 'Microsoft', 'Productivity', 1),
  ('Slack', 'Slack Technologies', 'Communication', 1),
  ('Microsoft Teams', 'Microsoft', 'Communication', 1),
  ('Google Chrome', 'Google', 'Browser', 1),
  ('Java Runtime', 'Oracle', 'Runtime', 0),
  ('Firefox', 'Mozilla', 'Browser', 1),
  ('Zoom', 'Zoom Video', 'Communication', 1),
  ('Notepad++', 'Don Ho', 'Utility', 0),
  ('Adobe Acrobat Reader', 'Adobe', 'Utility', 1),
  ('Spotify', 'Spotify AB', 'Entertainment', 0);

-- Devices list (some Windows, some macOS, some missing encryption/auto-lock)
INSERT INTO devices (device_id, hostname, username, department, os, os_version, last_seen, is_encrypted, auto_lock_enabled, needs_is_upgrade) VALUES
  ('dev-001', 'host-001', 'alice', 'Engineering', 'Windows', '11.0.22621', '2025-09-20', 1, 1, 0),
  ('dev-002', 'host-002', 'bob', 'Sales', 'macOS', '14.1', '2025-09-18', 1, 0, 1),
  ('dev-003', 'host-003', 'carol', 'HR', 'Windows', '10.0.19045', '2025-09-19', 0, 1, 1),
  ('dev-004', 'host-004', 'david', 'Engineering', 'macOS', '13.5', '2025-09-17', 1, 1, 0),
  ('dev-005', 'host-005', 'erin', 'Finance', 'Windows', '11.0.22621', '2025-09-21', 0, 0, 1),
  ('dev-006', 'host-006', 'frank', 'Support', 'Windows', '10.0.19045', '2025-09-18', 1, 1, 0),
  ('dev-007', 'host-007', 'grace', 'Engineering', 'macOS', '14.3', '2025-09-22', 1, 1, 0),
  ('dev-008', 'host-008', 'henry', 'Sales', 'Windows', '11.0.22631', '2025-09-20', 1, 0, 1);

-- Installed apps per device (variety of versions, outdated ones, etc.)
INSERT INTO device_apps (device_id, app_id, app_version, install_date, last_update, needs_update) VALUES
  -- dev-001 (Engineering)
  ('dev-001', 1, '365', '2024-05-01', '2025-08-01', 0),
  ('dev-001', 2, '4.29.149', '2024-04-01', '2025-07-01', 1),
  ('dev-001', 4, '121.0', '2024-05-10', '2025-07-15', 0),
  ('dev-001', 5, '8u281', '2024-01-15', '2024-06-10', 1),

  -- dev-002 (Sales)
  ('dev-002', 3, '1.5.00', '2024-06-01', '2025-08-10', 0),
  ('dev-002', 4, '122.0', '2024-05-20', '2025-07-15', 0),
  ('dev-002', 5, '8u251', '2024-01-10', '2024-05-15', 1),
  ('dev-002', 10, '1.0.94', '2024-03-01', '2024-05-01', 0),

  -- dev-003 (HR)
  ('dev-003', 1, '2019', '2023-10-01', '2024-12-01', 1),
  ('dev-003', 7, '5.17.11', '2024-01-01', '2025-05-15', 0),
  ('dev-003', 8, '8.6.3', '2024-04-10', '2025-07-01', 0),

  -- dev-004 (Engineering)
  ('dev-004', 1, '365', '2024-02-15', '2025-09-01', 0),
  ('dev-004', 2, '4.29.149', '2024-03-01', '2025-07-10', 0),
  ('dev-004', 4, '120.0', '2024-06-01', '2025-09-01', 1),

  -- dev-005 (Finance)
  ('dev-005', 1, '2016', '2023-12-01', '2024-03-01', 1),
  ('dev-005', 9, '2023.007', '2024-04-01', '2025-06-01', 0),
  ('dev-005', 5, '8u202', '2023-10-01', '2024-03-01', 1),

  -- dev-006 (Support)
  ('dev-006', 3, '1.4.00', '2024-05-10', '2025-06-20', 1),
  ('dev-006', 6, '119.0', '2024-04-01', '2025-09-01', 0),
  ('dev-006', 7, '5.16.0', '2024-02-01', '2025-07-15', 0),

  -- dev-007 (Engineering)
  ('dev-007', 2, '4.30.200', '2024-05-15', '2025-09-01', 0),
  ('dev-007', 1, '365', '2024-01-01', '2025-08-15', 0),
  ('dev-007', 9, '2023.009', '2024-03-15', '2025-08-01', 0),

  -- dev-008 (Sales)
  ('dev-008', 4, '119.0', '2024-04-15', '2025-07-10', 1),
  ('dev-008', 5, '8u181', '2023-08-01', '2024-04-01', 1),
  ('dev-008', 10, '1.0.84', '2023-07-01', '2024-01-01', 0);
