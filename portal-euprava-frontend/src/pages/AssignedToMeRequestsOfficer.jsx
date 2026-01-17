// src/pages/AssignedToMeRequestsOfficer.jsx
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
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconDownload,
  IconEye,
  IconLogout,
  IconRefresh,
  IconStatusChange,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";

import api from "../api/api";
import { clearAuth, getAuth } from "../utils/auth";
import Slider from "../components/Slider";
import FormDataPretty from "../components/FormDataPretty";

const NAVY = "#0B1F3B";

function StatusBadge({ status }) {
  const map = {
    DRAFT: { c: "gray", t: "DRAFT" },
    SUBMITTED: { c: "blue", t: "SUBMITTED" },
    IN_REVIEW: { c: "yellow", t: "IN_REVIEW" },
    APPROVED: { c: "green", t: "APPROVED" },
    REJECTED: { c: "red", t: "REJECTED" },
  };
  const s = map[status] ?? { c: "gray", t: status ?? "-" };
  return (
    <Badge color={s.c} variant="light">
      {s.t}.
    </Badge>
  );
}

export default function AssignedToMeRequestsOfficer() {
  const navigate = useNavigate();
  const auth = getAuth();

  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);

  // Modal
  const [opened, setOpened] = useState(false);
  const [selected, setSelected] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Per-row loading for status change
  const [rowBusy, setRowBusy] = useState({}); // { [id]: true }

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/service-requests");
      const list = Array.isArray(res.data?.data) ? res.data.data : res.data ?? [];
      setRequests(list);
    } catch (err) {
      notifications.show({
        title: "Greška.",
        message: err?.response?.data?.message || "Nije moguće učitati zahteve.",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      // ignore
    } finally {
      clearAuth();
      navigate("/auth", { replace: true });
    }
  };

  const assignedToMe = useMemo(() => {
    const myId = auth?.user?.id;
    return (requests || []).filter((r) => String(r.processed_by) === String(myId));
  }, [requests, auth]);

  const getServiceName = (r) => r?.service?.name ?? r?.service_name ?? "-";
  const getCitizenName = (r) => r?.citizen?.name ?? r?.user?.name ?? r?.citizen_name ?? "-";

  const openDetails = async (r) => {
    setOpened(true);
    setSelected(null);
    setDetailsLoading(true);

    try {
      const res = await api.get(`/service-requests/${r.id}`);
      const full = res.data?.data ?? res.data ?? r;
      setSelected(full);
    } catch (err) {
      setSelected(r);
    } finally {
      setDetailsLoading(false);
    }
  };

  const updateStatus = async (id, nextStatus) => {
    setRowBusy((p) => ({ ...p, [id]: true }));
    try {
      await api.patch(`/service-requests/${id}/status`, { status: nextStatus });

      notifications.show({
        title: "Uspešno.",
        message: `Status ažuriran na ${nextStatus}.`,
        color: "blue",
      });

      // Optimistic local update (bez čekanja load), pa onda tihi refresh.
      setRequests((prev) =>
        (prev || []).map((r) => (r.id === id ? { ...r, status: nextStatus } : r))
      );

      // Ako želiš striktno iz backend-a: odkomentariši load().
      // await load();
    } catch (err) {
      notifications.show({
        title: "Greška.",
        message: err?.response?.data?.message || "Promena statusa nije uspela.",
        color: "red",
      });
    } finally {
      setRowBusy((p) => ({ ...p, [id]: false }));
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Slider />

      <div style={{ flex: 1 }}>
        <div className="auth-page" style={{ padding: 0 }}>
          <Container size="lg" py={24} style={{ position: "relative", zIndex: 1 }}>
            {/* HERO HEADER */}
            <Paper
              radius="xl"
              style={{
                position: "relative",
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
                    <Title order={2} c={NAVY}>
                      Dodeljeni zahtevi.
                    </Title>
                    <Text c="dimmed" mt={4}>
                      Pregled svih zahteva dodeljenih vama i brza promena statusa.
                    </Text>
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
                      variant="light"
                      color="blue"
                      radius="xl"
                      leftSection={<IconLogout size={16} />}
                      onClick={logout}
                    >
                      Odjavi se.
                    </Button>
                  </Group>
                </Group>
              </div>
            </Paper>

            {/* METRICS */}
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
              <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                <Card withBorder radius="xl">
                  <Text c="dimmed" size="sm">
                    Ukupno dodeljeno.
                  </Text>
                  <Title order={2} c={NAVY}>
                    {assignedToMe.length}.
                  </Title>
                </Card>

                <Card withBorder radius="xl">
                  <Text c="dimmed" size="sm">
                    U obradi (IN_REVIEW).
                  </Text>
                  <Title order={2} c={NAVY}>
                    {assignedToMe.filter((x) => x.status === "IN_REVIEW").length}.
                  </Title>
                </Card>

                <Card withBorder radius="xl">
                  <Text c="dimmed" size="sm">
                    Završeno (APPROVED/REJECTED).
                  </Text>
                  <Title order={2} c={NAVY}>
                    {assignedToMe.filter((x) => ["APPROVED", "REJECTED"].includes(x.status)).length}.
                  </Title>
                </Card>
              </SimpleGrid>
            </Paper>

            {/* TABLE */}
            <Paper
              radius="xl"
              p="lg"
              style={{
                border: "1px solid rgba(11,31,59,0.12)",
                background: "rgba(255,255,255,0.90)",
                backdropFilter: "blur(8px)",
              }}
            >
              <Group justify="space-between" mb="sm">
                <Title order={4} c={NAVY}>
                  Lista dodeljenih zahteva.
                </Title>
                <Text c="dimmed">Prikazano: {assignedToMe.length}.</Text>
              </Group>

              {loading ? (
                <Group justify="center" py={26}>
                  <Loader />
                </Group>
              ) : (
                <>
                  <Divider mb="md" />

                  <Table striped highlightOnHover withTableBorder>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>ID.</Table.Th>
                        <Table.Th>Servis.</Table.Th>
                        <Table.Th>Građanin.</Table.Th>
                        <Table.Th>Status.</Table.Th>
                        <Table.Th>Promena statusa.</Table.Th>
                        <Table.Th>Akcije.</Table.Th>
                      </Table.Tr>
                    </Table.Thead>

                    <Table.Tbody>
                      {assignedToMe.map((r) => (
                        <Table.Tr key={r.id}>
                          <Table.Td>{r.id}.</Table.Td>
                          <Table.Td>{getServiceName(r)}.</Table.Td>
                          <Table.Td>{getCitizenName(r)}.</Table.Td>
                          <Table.Td>
                            <StatusBadge status={r.status} />
                          </Table.Td>

                          <Table.Td style={{ width: 240 }}>
                            <Select
                              radius="xl"
                              placeholder="Izaberi status."
                              value={null}
                              disabled={!!rowBusy[r.id]}
                              leftSection={<IconStatusChange size={16} />}
                              data={[
                                { value: "IN_REVIEW", label: "IN_REVIEW." },
                                { value: "APPROVED", label: "APPROVED." },
                                { value: "REJECTED", label: "REJECTED." },
                              ]}
                              onChange={(v) => v && updateStatus(r.id, v)}
                            />
                          </Table.Td>

                          <Table.Td>
                            <Group gap="xs">
                              <Button
                                size="xs"
                                radius="xl"
                                variant="light"
                                color="blue"
                                leftSection={<IconEye size={16} />}
                                onClick={() => openDetails(r)}
                              >
                                Detalji.
                              </Button>

                              <ActionIcon
                                variant="light"
                                color="blue"
                                component="a"
                                href={`/api/service-requests/${r.id}/pdf`}
                                target="_blank"
                                rel="noreferrer"
                                aria-label="pdf"
                              >
                                <IconDownload size={18} />
                              </ActionIcon>
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      ))}

                      {assignedToMe.length === 0 && (
                        <Table.Tr>
                          <Table.Td colSpan={6}>
                            <Text c="dimmed">Nemate dodeljene zahteve trenutno.</Text>
                          </Table.Td>
                        </Table.Tr>
                      )}
                    </Table.Tbody>
                  </Table>
                </>
              )}
            </Paper>
          </Container>
        </div>
      </div>

      {/* DETAILS MODAL */}
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title={<Text fw={800} c={NAVY}>Detalji zahteva.</Text>}
        size="lg"
        radius="xl"
        centered
      >
        {detailsLoading ? (
          <Group justify="center" py={20}>
            <Loader />
          </Group>
        ) : !selected ? (
          <Text c="dimmed">Nema podataka za prikaz.</Text>
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
                    Status:
                  </Text>{" "}
                  {selected.status}.
                </Text>
                <Text>
                  <Text span fw={700} c={NAVY}>
                    Servis:
                  </Text>{" "}
                  {getServiceName(selected)}.
                </Text>
                <Text>
                  <Text span fw={700} c={NAVY}>
                    Građanin:
                  </Text>{" "}
                  {getCitizenName(selected)}.
                </Text>
              </SimpleGrid>
            </Card>

            <Card withBorder radius="xl" p="md">
              <Text fw={800} c={NAVY} mb={8}>
                Podaci iz forme.
              </Text>

              <FormDataPretty service={selected?.service} formData={selected?.form_data} />
            </Card>

            {selected?.citizen_note && (
              <Card withBorder radius="xl" p="md">
                <Text fw={800} c={NAVY} mb={8}>
                  Napomena građanina.
                </Text>
                <Text c="dimmed">{selected.citizen_note}</Text>
              </Card>
            )}

            <Group justify="flex-end" gap="xs">
              <Button
                radius="xl"
                variant="light"
                color="blue"
                component="a"
                href={`/api/service-requests/${selected.id}/pdf`}
                target="_blank"
                rel="noreferrer"
                leftSection={<IconDownload size={16} />}
              >
                Preuzmi PDF.
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </div>
  );
}
