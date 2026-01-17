// src/pages/UsersAdmin.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Container,
  Divider,
  Group,
  Loader,
  Modal,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconCheck,
  IconEdit,
  IconEye,
  IconRefresh,
  IconSearch,
  IconTrash,
  IconUsers,
  IconX,
} from "@tabler/icons-react";

import api from "../api/api";
import Slider from "../components/Slider";
import { getAuth } from "../utils/auth";

const NAVY = "#0B1F3B";

function getListPayload(res) {
  return Array.isArray(res?.data?.data) ? res.data.data : res?.data ?? [];
}

function RoleBadge({ role }) {
  const map = {
    ADMIN: { c: "grape", t: "ADMIN" },
    OFFICER: { c: "blue", t: "OFFICER" },
    CITIZEN: { c: "teal", t: "CITIZEN" },
  };
  const x = map[role] ?? { c: "gray", t: role ?? "-" };
  return (
    <Badge variant="light" color={x.c}>
      {x.t}.
    </Badge>
  );
}

export default function UsersAdmin() {
  const auth = getAuth();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);

  // filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  // modal
  const [opened, setOpened] = useState(false);
  const [mode, setMode] = useState("VIEW"); // VIEW | EDIT_ROLE
  const [selected, setSelected] = useState(null);

  // edit role
  const [nextRole, setNextRole] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/users");
      setUsers(getListPayload(res));
    } catch (err) {
      notifications.show({
        title: "Greška.",
        message:
          err?.response?.data?.message ||
          "Nije moguće učitati korisnike. Proverite autorizaciju.",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  const openView = async (row) => {
    setMode("VIEW");
    setSelected(row);
    setOpened(true);

    try {
      const res = await api.get(`/users/${row.id}`);
      const full = res?.data?.data ?? res?.data ?? row;
      setSelected(full);
    } catch (e) {
      // ignore
    }
  };

  const openEditRole = async (row) => {
    setMode("EDIT_ROLE");
    setSelected(row);
    setNextRole(row?.role ?? null);
    setOpened(true);

    try {
      const res = await api.get(`/users/${row.id}`);
      const full = res?.data?.data ?? res?.data ?? row;
      setSelected(full);
      setNextRole(full?.role ?? row?.role ?? null);
    } catch (e) {
      // ignore
    }
  };

  const close = () => {
    setOpened(false);
    setMode("VIEW");
    setSelected(null);
    setNextRole(null);
    setSaving(false);
  };

  const saveRole = async () => {
    if (!selected?.id) return;
    if (!nextRole) {
      notifications.show({
        title: "Greška.",
        message: "Morate izabrati ulogu.",
        color: "red",
      });
      return;
    }

    setSaving(true);
    try {
      await api.patch(`/users/${selected.id}/role`, { role: nextRole });

      notifications.show({
        title: "Uspešno.",
        message: "Uloga je ažurirana.",
        icon: <IconCheck size={18} />,
        color: "blue",
      });

      close();
      load();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (err?.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(" ")
          : "Ažuriranje uloge nije uspelo.");

      notifications.show({ title: "Greška.", message: msg, color: "red" });
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (row) => {
    if (!row?.id) return;

    if (String(auth?.user?.id) === String(row.id)) {
      notifications.show({
        title: "Greška.",
        message: "Ne možete obrisati sopstveni nalog.",
        color: "red",
      });
      return;
    }

    const ok = window.confirm(`Obriši korisnika "${row?.name}"?`);
    if (!ok) return;

    try {
      await api.delete(`/users/${row.id}`);
      notifications.show({
        title: "Uspešno.",
        message: "Korisnik je obrisan.",
        color: "blue",
      });
      load();
    } catch (err) {
      notifications.show({
        title: "Greška.",
        message: err?.response?.data?.message || "Brisanje korisnika nije uspelo.",
        color: "red",
      });
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return (users || [])
      .filter((u) => {
        if (roleFilter !== "ALL" && String(u.role) !== String(roleFilter)) return false;

        if (!q) return true;

        const hay = [
          u?.id,
          u?.name,
          u?.email,
          u?.role,
          u?.jmbg,
          u?.date_of_birth,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return hay.includes(q);
      })
      .sort((a, b) => String(a?.name ?? "").localeCompare(String(b?.name ?? "")));
  }, [users, search, roleFilter]);

  const counts = useMemo(() => {
    const list = users || [];
    const by = (r) => list.filter((u) => u.role === r).length;
    return {
      total: list.length,
      admins: by("ADMIN"),
      officers: by("OFFICER"),
      citizens: by("CITIZEN"),
    };
  }, [users]);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Slider />

      <div style={{ flex: 1 }}>
        <div className="auth-page" style={{ padding: 0 }}>
          <Container size="lg" py={24} style={{ position: "relative", zIndex: 1 }}>
            {/* Header */}
            <Paper
              radius="xl"
              style={{
                overflow: "hidden",
                border: "1px solid rgba(11,31,59,0.12)",
                background: "rgba(255,255,255,0.92)",
                backdropFilter: "blur(8px)",
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  padding: 18,
                  background:
                    "radial-gradient(900px 320px at 10% 10%, rgba(11,31,59,0.10), transparent 60%)," +
                    "radial-gradient(700px 300px at 85% 20%, rgba(11,31,59,0.08), transparent 55%)," +
                    "linear-gradient(180deg, rgba(231,240,255,0.70), rgba(255,255,255,0.95))",
                }}
              >
                <Group justify="space-between" align="flex-start">
                  <div>
                    <Group gap="sm">
                      <IconUsers size={22} color={NAVY} />
                      <div>
                        <Title order={2} c={NAVY}>
                          Korisnici – admin.
                        </Title>
                        <Text c="dimmed" mt={4}>
                          Upravljanje korisnicima i ulogama.
                        </Text>
                      </div>
                    </Group>
                  </div>

                  <Group>
                    <ActionIcon
                      variant="light"
                      color="blue"
                      radius="xl"
                      onClick={load}
                      aria-label="refresh"
                      style={{
                        border: "1px solid rgba(11,31,59,0.12)",
                        background: "rgba(255,255,255,0.70)",
                        backdropFilter: "blur(10px)",
                      }}
                    >
                      <IconRefresh size={18} />
                    </ActionIcon>
                  </Group>
                </Group>
              </div>
            </Paper>

            {/* Summary + filters */}
            <Paper
              radius="xl"
              p="lg"
              style={{
                border: "1px solid rgba(11,31,59,0.12)",
                background: "rgba(255,255,255,0.90)",
                backdropFilter: "blur(8px)",
                marginBottom: 14,
              }}
            >
              <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
                <Card withBorder radius="xl" p="md">
                  <Text c="dimmed" size="sm">
                    Ukupno.
                  </Text>
                  <Title order={2} c={NAVY}>
                    {counts.total}.
                  </Title>
                </Card>
                <Card withBorder radius="xl" p="md">
                  <Text c="dimmed" size="sm">
                    Admin.
                  </Text>
                  <Title order={2} c={NAVY}>
                    {counts.admins}.
                  </Title>
                </Card>
                <Card withBorder radius="xl" p="md">
                  <Text c="dimmed" size="sm">
                    Officer.
                  </Text>
                  <Title order={2} c={NAVY}>
                    {counts.officers}.
                  </Title>
                </Card>
                <Card withBorder radius="xl" p="md">
                  <Text c="dimmed" size="sm">
                    Citizen.
                  </Text>
                  <Title order={2} c={NAVY}>
                    {counts.citizens}.
                  </Title>
                </Card>
              </SimpleGrid>

              <Divider my="lg" />

              <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
                <TextInput
                  label="Pretraga."
                  placeholder="Ime, email, uloga, JMBG."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  radius="xl"
                  leftSection={<IconSearch size={16} />}
                />

                <Select
                  label="Uloga."
                  value={roleFilter}
                  onChange={(v) => setRoleFilter(v || "ALL")}
                  data={[
                    { value: "ALL", label: "Sve." },
                    { value: "CITIZEN", label: "CITIZEN." },
                    { value: "OFFICER", label: "OFFICER." },
                    { value: "ADMIN", label: "ADMIN." },
                  ]}
                  radius="xl"
                />

                <Card withBorder radius="xl" p="md">
                  <Text c="dimmed" size="sm">
                    Prikazano.
                  </Text>
                  <Title order={2} c={NAVY}>
                    {filtered.length}.
                  </Title>
                </Card>
              </SimpleGrid>
            </Paper>

            {/* Table */}
            <Paper
              radius="xl"
              p="lg"
              style={{
                border: "1px solid rgba(11,31,59,0.12)",
                background: "rgba(255,255,255,0.90)",
                backdropFilter: "blur(8px)",
              }}
            >
              {loading ? (
                <Group justify="center" py={26}>
                  <Loader />
                </Group>
              ) : (
                <Stack gap="md">
                  <Table striped highlightOnHover withTableBorder>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>ID.</Table.Th>
                        <Table.Th>Ime.</Table.Th>
                        <Table.Th>Email.</Table.Th>
                        <Table.Th>Uloga.</Table.Th>
                        <Table.Th>Datum rođenja.</Table.Th>
                        <Table.Th>Akcije.</Table.Th>
                      </Table.Tr>
                    </Table.Thead>

                    <Table.Tbody>
                      {filtered.map((u) => (
                        <Table.Tr key={u.id}>
                          <Table.Td>{u.id}.</Table.Td>
                          <Table.Td>
                            <Text fw={800} c={NAVY}>
                              {u.name ?? "-"}.
                            </Text>
                          </Table.Td>
                          <Table.Td>{u.email ?? "-"}</Table.Td>
                          <Table.Td>
                            <RoleBadge role={u.role} />
                          </Table.Td>
                          <Table.Td>{u.date_of_birth ?? "-"}</Table.Td>
                          <Table.Td>
                            <Group gap="xs">
                              <Button
                                size="xs"
                                radius="xl"
                                variant="light"
                                color="blue"
                                leftSection={<IconEye size={16} />}
                                onClick={() => openView(u)}
                              >
                                Detalji.
                              </Button>

                              <Button
                                size="xs"
                                radius="xl"
                                variant="light"
                                color="blue"
                                leftSection={<IconEdit size={16} />}
                                onClick={() => openEditRole(u)}
                              >
                                Uloga.
                              </Button>

                              <ActionIcon
                                variant="light"
                                color="red"
                                radius="xl"
                                aria-label="delete"
                                onClick={() => deleteUser(u)}
                              >
                                <IconTrash size={18} />
                              </ActionIcon>
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      ))}

                      {filtered.length === 0 && (
                        <Table.Tr>
                          <Table.Td colSpan={6}>
                            <Text c="dimmed">Nema korisnika za prikaz.</Text>
                          </Table.Td>
                        </Table.Tr>
                      )}
                    </Table.Tbody>
                  </Table>
                </Stack>
              )}
            </Paper>
          </Container>
        </div>
      </div>

      {/* Modal */}
      <Modal
        opened={opened}
        onClose={close}
        centered
        radius="xl"
        size="lg"
        title={
          <Text fw={900} c={NAVY}>
            {mode === "EDIT_ROLE" ? "Izmena uloge." : "Detalji korisnika."}
          </Text>
        }
      >
        {!selected ? (
          <Group justify="center" py={18}>
            <Loader />
          </Group>
        ) : (
          <Stack gap="md">
            <Card withBorder radius="xl" p="md">
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
                <Text>
                  <Text span fw={700} c={NAVY}>
                    ID:
                  </Text>{" "}
                  {selected.id}.
                </Text>
                <Text>
                  <Text span fw={700} c={NAVY}>
                    Uloga:
                  </Text>{" "}
                  {selected.role}.
                </Text>
                <Text>
                  <Text span fw={700} c={NAVY}>
                    Ime:
                  </Text>{" "}
                  {selected.name ?? "-"}.
                </Text>
                <Text>
                  <Text span fw={700} c={NAVY}>
                    Email:
                  </Text>{" "}
                  {selected.email ?? "-"}.
                </Text>
                <Text>
                  <Text span fw={700} c={NAVY}>
                    Datum rođenja:
                  </Text>{" "}
                  {selected.date_of_birth ?? "-"}.
                </Text>
                <Text>
                  <Text span fw={700} c={NAVY}>
                    JMBG:
                  </Text>{" "}
                  {selected.jmbg ?? "-"}.
                </Text>
                <Text>
                  <Text span fw={700} c={NAVY}>
                    Kreiran:
                  </Text>{" "}
                  {selected.created_at ?? "-"}.
                </Text>
                <Text>
                  <Text span fw={700} c={NAVY}>
                    Ažuriran:
                  </Text>{" "}
                  {selected.updated_at ?? "-"}.
                </Text>
              </SimpleGrid>
            </Card>

            {mode === "EDIT_ROLE" && (
              <Card withBorder radius="xl" p="md">
                <Select
                  label="Nova uloga."
                  value={nextRole}
                  onChange={setNextRole}
                  radius="xl"
                  data={[
                    { value: "CITIZEN", label: "CITIZEN." },
                    { value: "OFFICER", label: "OFFICER." },
                    { value: "ADMIN", label: "ADMIN." },
                  ]}
                  required
                />

                <Divider my="md" />

                <Group justify="flex-end" gap="xs">
                  <Button
                    radius="xl"
                    variant="light"
                    color="gray"
                    leftSection={<IconX size={16} />}
                    onClick={close}
                  >
                    Otkaži.
                  </Button>

                  <Button
                    radius="xl"
                    color="blue"
                    loading={saving}
                    leftSection={<IconCheck size={16} />}
                    onClick={saveRole}
                  >
                    Sačuvaj.
                  </Button>
                </Group>
              </Card>
            )}
          </Stack>
        )}
      </Modal>
    </div>
  );
}
