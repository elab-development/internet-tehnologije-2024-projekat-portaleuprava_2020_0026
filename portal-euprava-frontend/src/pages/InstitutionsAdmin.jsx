// src/pages/InstitutionsAdmin.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Divider,
  Group,
  Loader,
  Modal,
  Paper,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconBuilding,
  IconCheck,
  IconEdit,
  IconEye,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconTrash,
  IconX,
} from "@tabler/icons-react";

import { useNavigate } from "react-router-dom";
import api from "../api/api";
import Slider from "../components/Slider";

const NAVY = "#0B1F3B";

function safeArr(x) {
  return Array.isArray(x) ? x : [];
}
function getListPayload(res) {
  return Array.isArray(res?.data?.data) ? res.data.data : res?.data ?? [];
}

function StatusPill({ text }) {
  return (
    <Badge variant="light" color="blue">
      {text}.
    </Badge>
  );
}

export default function InstitutionsAdmin() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [institutions, setInstitutions] = useState([]);

  // Filter
  const [search, setSearch] = useState("");

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("CREATE"); // CREATE | EDIT | VIEW
  const [selected, setSelected] = useState(null);

  // Form fields (match backend)
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");

  const resetForm = () => {
    setName("");
    setCity("");
    setAddress("");
    setEmail("");
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/institutions");
      setInstitutions(getListPayload(res));
    } catch (err) {
      notifications.show({
        title: "Greška.",
        message:
          err?.response?.data?.message ||
          "Nije moguće učitati institucije. Proverite autorizaciju i konekciju.",
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

  const closeModal = () => {
    setModalOpen(false);
    setModalMode("CREATE");
    setSelected(null);
    resetForm();
  };

  const openCreate = () => {
    setModalMode("CREATE");
    setSelected(null);
    resetForm();
    setModalOpen(true);
  };

  const openView = async (row) => {
    setModalMode("VIEW");
    setSelected(row);
    setModalOpen(true);

    try {
      const res = await api.get(`/institutions/${row.id}`);
      const inst = res?.data?.data ?? res?.data ?? row;
      setSelected(inst);
    } catch (e) {
      // ignore
    }
  };

  const openEdit = async (row) => {
    setModalMode("EDIT");
    setSelected(row);
    setModalOpen(true);

    try {
      const res = await api.get(`/institutions/${row.id}`);
      const inst = res?.data?.data ?? res?.data ?? row;
      setSelected(inst);

      setName(inst?.name ?? "");
      setCity(inst?.city ?? "");
      setAddress(inst?.address ?? "");
      setEmail(inst?.email ?? "");
    } catch (e) {
      setName(row?.name ?? "");
      setCity(row?.city ?? "");
      setAddress(row?.address ?? "");
      setEmail(row?.email ?? "");
    }
  };

  const validateCreate = () => {
    if (!name.trim()) {
      notifications.show({ title: "Greška.", message: "Naziv je obavezan.", color: "red" });
      return false;
    }
    if (!city.trim()) {
      notifications.show({ title: "Greška.", message: "Grad je obavezan.", color: "red" });
      return false;
    }
    if (!address.trim()) {
      notifications.show({ title: "Greška.", message: "Adresa je obavezna.", color: "red" });
      return false;
    }
    return true;
  };

  const handleCreate = async () => {
    if (!validateCreate()) return;

    setSubmitting(true);
    try {
      // Backend expects: name, city, address, email(optional)
      const payload = {
        name: name.trim(),
        city: city.trim(),
        address: address.trim(),
        email: email.trim() || null,
      };

      await api.post("/institutions", payload);

      notifications.show({
        title: "Uspešno.",
        message: "Institucija je kreirana.",
        icon: <IconCheck size={18} />,
        color: "blue",
      });

      closeModal();
      load();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (err?.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(" ")
          : "Kreiranje institucije nije uspelo.");

      notifications.show({ title: "Greška.", message: msg, color: "red" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selected?.id) return;

    setSubmitting(true);
    try {
      // Backend uses "sometimes", so send only fields that are not empty strings
      // (but allow empty email -> null)
      const payload = {};

      if (name.trim()) payload.name = name.trim();
      if (city.trim()) payload.city = city.trim();
      if (address.trim()) payload.address = address.trim();

      // email: if user cleared it, we should send null to remove it
      // but controller allows 'sometimes|nullable' so include email if changed
      payload.email = email.trim() ? email.trim() : null;

      await api.put(`/institutions/${selected.id}`, payload);

      notifications.show({
        title: "Uspešno.",
        message: "Institucija je izmenjena.",
        icon: <IconCheck size={18} />,
        color: "blue",
      });

      closeModal();
      load();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (err?.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(" ")
          : "Izmena institucije nije uspela.");

      notifications.show({ title: "Greška.", message: msg, color: "red" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (row) => {
    const ok = window.confirm(`Obriši instituciju "${row?.name}"?`);
    if (!ok) return;

    try {
      await api.delete(`/institutions/${row.id}`);
      notifications.show({ title: "Uspešno.", message: "Institucija je obrisana.", color: "blue" });
      load();
    } catch (err) {
      notifications.show({
        title: "Greška.",
        message: err?.response?.data?.message || "Brisanje nije uspelo.",
        color: "red",
      });
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = safeArr(institutions);

    if (!q) return list;

    return list.filter((x) => {
      const hay = [x?.id, x?.name, x?.city, x?.address, x?.email]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [institutions, search]);

  const isView = modalMode === "VIEW";
  const isEdit = modalMode === "EDIT";
  const isCreate = modalMode === "CREATE";

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
              <Box
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
                    <Title order={2} c={NAVY}>
                      Institucije – admin.
                    </Title>
                    <Text c="dimmed" mt={4}>
                      Upravljanje institucijama.
                    </Text>
                    <Group gap="xs" mt={10}>
                      <StatusPill text={`Ukupno: ${filtered.length}`} />
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

                    <Button
                      radius="xl"
                      color="blue"
                      leftSection={<IconPlus size={16} />}
                      onClick={openCreate}
                    >
                      Nova institucija.
                    </Button>
                  </Group>
                </Group>
              </Box>
            </Paper>

            {/* Controls */}
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
              <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
                <TextInput
                  label="Pretraga."
                  placeholder="Naziv, grad, adresa, email."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  radius="xl"
                  leftSection={<IconSearch size={16} />}
                />
              </SimpleGrid>
            </Paper>

            {/* List */}
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
                  <Group justify="space-between" align="center">
                    <Title order={4} c={NAVY}>
                      Lista institucija.
                    </Title>
                    <Text c="dimmed">Prikazano: {filtered.length}.</Text>
                  </Group>

                  <Divider />

                  <Table striped highlightOnHover withTableBorder>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>ID.</Table.Th>
                        <Table.Th>Naziv.</Table.Th>
                        <Table.Th>Grad.</Table.Th>
                        <Table.Th>Adresa.</Table.Th>
                        <Table.Th>Email.</Table.Th>
                        <Table.Th>Akcije.</Table.Th>
                      </Table.Tr>
                    </Table.Thead>

                    <Table.Tbody>
                      {filtered.map((inst) => (
                        <Table.Tr key={inst.id}>
                          <Table.Td>{inst.id}.</Table.Td>

                          <Table.Td>
                            <Text fw={800} c={NAVY}>
                              {inst.name ?? "-"}.
                            </Text>
                          </Table.Td>

                          <Table.Td>{inst.city ?? "-"}</Table.Td>
                          <Table.Td>{inst.address ?? "-"}</Table.Td>
                          <Table.Td>{inst.email ?? "-"}</Table.Td>

                          <Table.Td>
                            <Group gap="xs">
                              <Button
                                size="xs"
                                radius="xl"
                                variant="light"
                                color="blue"
                                leftSection={<IconEye size={16} />}
                                onClick={() => openView(inst)}
                              >
                                Detalji.
                              </Button>

                              <Button
                                size="xs"
                                radius="xl"
                                variant="light"
                                color="blue"
                                leftSection={<IconEdit size={16} />}
                                onClick={() => openEdit(inst)}
                              >
                                Izmeni.
                              </Button>

                              <ActionIcon
                                variant="light"
                                color="red"
                                radius="xl"
                                aria-label="delete"
                                onClick={() => handleDelete(inst)}
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
                            <Text c="dimmed">Nema institucija za prikaz.</Text>
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
        opened={modalOpen}
        onClose={closeModal}
        centered
        radius="xl"
        size="lg"
        title={
          <Group gap="sm">
            <IconBuilding size={18} color={NAVY} />
            <Text fw={900} c={NAVY}>
              {isCreate ? "Nova institucija." : isEdit ? "Izmena institucije." : "Detalji institucije."}
            </Text>
          </Group>
        }
      >
        <Stack gap="md">
          {isView && selected ? (
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
                    Naziv:
                  </Text>{" "}
                  {selected.name ?? "-"}.
                </Text>
                <Text>
                  <Text span fw={700} c={NAVY}>
                    Grad:
                  </Text>{" "}
                  {selected.city ?? "-"}.
                </Text>
                <Text>
                  <Text span fw={700} c={NAVY}>
                    Email:
                  </Text>{" "}
                  {selected.email ?? "-"}.
                </Text>
                <Text style={{ gridColumn: "1 / -1" }}>
                  <Text span fw={700} c={NAVY}>
                    Adresa:
                  </Text>{" "}
                  {selected.address ?? "-"}.
                </Text>
              </SimpleGrid>
            </Card>
          ) : (
            <>
              <TextInput
                label="Naziv."
                placeholder="npr. Opština Novi Beograd."
                value={name}
                onChange={(e) => setName(e.target.value)}
                radius="xl"
                required
              />

              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                <TextInput
                  label="Grad."
                  placeholder="npr. Beograd."
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  radius="xl"
                  required={isCreate}
                />

                <TextInput
                  label="Email."
                  placeholder="npr. info@institucija.rs."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  radius="xl"
                />
              </SimpleGrid>

              <TextInput
                label="Adresa."
                placeholder="npr. Bulevar Mihajla Pupina 167."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                radius="xl"
                required={isCreate}
              />
            </>
          )}

          <Divider />

          <Group justify="flex-end" gap="xs">
            <Button
              radius="xl"
              variant="light"
              color="gray"
              leftSection={<IconX size={16} />}
              onClick={closeModal}
            >
              Zatvori.
            </Button>

            {!isView && (
              <Button
                radius="xl"
                color="blue"
                loading={submitting}
                leftSection={<IconCheck size={16} />}
                onClick={isCreate ? handleCreate : handleUpdate}
              >
                {isCreate ? "Kreiraj." : "Sačuvaj."}
              </Button>
            )}
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}
