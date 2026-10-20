import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { Button, Card, Input, Modal, Spinner, Table, Badge } from "@/ui";

const empty = { email: "", full_name: "", password: "", roles: ["employee"] };

export default function AdminUsers() {
  const toast = useToast();
  const [users, setUsers] = useState(null);
  const [roles, setRoles] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [edit, setEdit] = useState(null);
  const [pwdOpen, setPwdOpen] = useState(null);
  const [newPwd, setNewPwd] = useState("");
  const [search, setSearch] = useState("");

  const load = async () => {
    try {
      const [u, r] = await Promise.all([adminApi.users({ q: search || undefined }), adminApi.roles()]);
      setUsers(u);
      setRoles(r);
    } catch (e) {
      toast.error(e.message);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const create = async () => {
    if (!form.email || !form.password) {
      toast.error("Email y contraseña son obligatorios");
      return;
    }
    try {
      await adminApi.createUser(form);
      toast.success("Usuario creado exitosamente");
      setCreateOpen(false);
      setForm(empty);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const saveEdit = async () => {
    try {
      await adminApi.updateUser(edit.id, {
        full_name: edit.full_name,
        is_active: edit.is_active,
        roles: edit.roles,
      });
      toast.success("Usuario actualizado correctamente");
      setEdit(null);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const resetPwd = async () => {
    if (!newPwd) {
      toast.error("La contraseña no puede estar vacía");
      return;
    }
    try {
      await adminApi.resetPassword(pwdOpen.id, newPwd);
      toast.success("Contraseña restablecida con éxito");
      setPwdOpen(null);
      setNewPwd("");
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (!users) {
    return (
      <div className="container" style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
        <Spinner />
      </div>
    );
  }

  return (
    <div className="container">
      <div className="row-between mb-5">
        <div>
          <h1>Gestión de Usuarios & Control de Acceso</h1>
          <p className="text-muted text-sm mt-1">
            Administración de cuentas corporativas, asignación de roles y políticas de acceso
          </p>
        </div>

        <div className="row">
          <Input
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 260, marginBottom: 0 }}
          />
          <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
            + Nuevo Usuario
          </Button>
        </div>
      </div>

      <Card padding="md">
        <Table
          rowKey={(r) => r.id}
          columns={[
            {
              key: "full_name",
              title: "Nombre Completo",
              render: (r) => (
                <div>
                  <div style={{ fontWeight: 600 }}>{r.full_name || "—"}</div>
                  <div className="text-muted text-xs">{r.email}</div>
                </div>
              ),
            },
            {
              key: "roles",
              title: "Roles Asignados",
              render: (r) => (
                <div className="row" style={{ gap: 4 }}>
                  {(r.roles || []).map((rl) => (
                    <Badge key={rl} tone={rl === "admin" ? "danger" : rl === "security_analyst" ? "warning" : "default"}>
                      {rl}
                    </Badge>
                  ))}
                </div>
              ),
            },
            {
              key: "is_active",
              title: "Estado",
              render: (r) => (
                <Badge tone={r.is_active ? "success" : "muted"}>
                  {r.is_active ? "Activo" : "Inactivo"}
                </Badge>
              ),
            },
            {
              key: "last_login_at",
              title: "Último Acceso",
              render: (r) =>
                r.last_login_at
                  ? new Date(r.last_login_at).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })
                  : "Nunca",
            },
            {
              key: "actions",
              title: "Acciones",
              align: "right",
              render: (r) => (
                <div className="row" style={{ justifyContent: "flex-end", gap: 6 }}>
                  <Button size="xs" variant="secondary" onClick={() => setEdit(r)}>
                    Editar
                  </Button>
                  <Button size="xs" variant="ghost" onClick={() => setPwdOpen(r)}>
                    Reset Pwd
                  </Button>
                </div>
              ),
            },
          ]}
          rows={users}
          empty="No se encontraron usuarios coincidentes"
        />
      </Card>

      {/* Modal Crear Usuario */}
      <Modal
        open={createOpen}
        title="Crear Nuevo Usuario"
        onClose={() => setCreateOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={create}>
              Crear Cuenta
            </Button>
          </>
        }
      >
        <Input
          label="Nombre Completo"
          placeholder="Ej: Laura Martínez"
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
        />
        <Input
          label="Email Corporativo"
          type="email"
          placeholder="laura@empresa.com"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <Input
          label="Contraseña Inicial"
          type="password"
          placeholder="••••••••••••"
          required
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <div className="field">
          <label className="field-label">Roles Permitidos</label>
          <div className="row mt-2" style={{ gap: 12 }}>
            {roles.map((r) => (
              <label key={r.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={form.roles.includes(r.name)}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...form.roles, r.name]
                      : form.roles.filter((x) => x !== r.name);
                    setForm({ ...form, roles: next });
                  }}
                />
                {r.name}
              </label>
            ))}
          </div>
        </div>
      </Modal>

      {/* Modal Editar Usuario */}
      <Modal
        open={Boolean(edit)}
        title="Modificar Usuario"
        onClose={() => setEdit(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEdit(null)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={saveEdit}>
              Guardar Cambios
            </Button>
          </>
        }
      >
        {edit && (
          <>
            <Input
              label="Nombre Completo"
              value={edit.full_name || ""}
              onChange={(e) => setEdit({ ...edit, full_name: e.target.value })}
            />

            <div className="field">
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={edit.is_active}
                  onChange={(e) => setEdit({ ...edit, is_active: e.target.checked })}
                />
                Usuario Activo
              </label>
            </div>

            <div className="field mt-3">
              <label className="field-label">Asignación de Roles</label>
              <div className="row mt-2" style={{ gap: 12 }}>
                {roles.map((r) => (
                  <label key={r.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={edit.roles?.includes(r.name)}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...(edit.roles || []), r.name]
                          : (edit.roles || []).filter((x) => x !== r.name);
                        setEdit({ ...edit, roles: next });
                      }}
                    />
                    {r.name}
                  </label>
                ))}
              </div>
            </div>
          </>
        )}
      </Modal>

      {/* Modal Reset Password */}
      <Modal
        open={Boolean(pwdOpen)}
        title="Restablecer Contraseña"
        onClose={() => setPwdOpen(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPwdOpen(null)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={resetPwd}>
              Actualizar Contraseña
            </Button>
          </>
        }
      >
        {pwdOpen && (
          <>
            <p className="text-muted text-sm mb-3">
              Establecer nueva contraseña para <b>{pwdOpen.email}</b>.
            </p>
            <Input
              label="Nueva Contraseña"
              type="password"
              placeholder="••••••••••••"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
            />
          </>
        )}
      </Modal>
    </div>
  );
}