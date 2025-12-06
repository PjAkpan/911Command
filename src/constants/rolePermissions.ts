import { rolePermissions } from "../types/functions";

export const RolePermissionsMap: Record<string, rolePermissions[]> = {
  CUSTOMER: [
    rolePermissions.VIEW,
    rolePermissions.CREATE,
    rolePermissions.EDIT,
  ],
  ADMIN: [
    rolePermissions.VIEW,
    rolePermissions.READ,
    rolePermissions.CREATE,
    rolePermissions.UPDATE,
    rolePermissions.DELETE,
  ],
  RESPONDER: [
    rolePermissions.VIEW,
    rolePermissions.READ,
    rolePermissions.CREATE,
    rolePermissions.EDIT,
  ],
  INITIATOR: [
    rolePermissions.VIEW,
    rolePermissions.CREATE,
    rolePermissions.EDIT,
  ],
  APPROVER: [
    rolePermissions.VIEW,
    rolePermissions.CREATE,
    rolePermissions.EDIT,
  ],
  SUPERADMIN: [
    rolePermissions.VIEW,
    rolePermissions.READ,
    rolePermissions.CREATE,
    rolePermissions.UPDATE,
    rolePermissions.DELETE,
  ],
};



