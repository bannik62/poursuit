let adminTokenVersion = 1;

export function getAdminTokenVersion() {
  return adminTokenVersion;
}

export function bumpAdminTokenVersion() {
  adminTokenVersion += 1;
  return adminTokenVersion;
}

