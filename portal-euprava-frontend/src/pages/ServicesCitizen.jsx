// src/pages/ServicesCitizen.jsx

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
  IconCheck,
  IconDownload,
  IconRefresh,
  IconSearch,
  IconSend,
  IconPlus,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";

import api from "../api/api";
import Slider from "../components/Slider";

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

export default function ServicesCitizen() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  const [services, setServices] = useState([]);
  const [requests, setRequests] = useState([]);

  const [q, setQ] = useState("");

  const [submittingAll, setSubmittingAll] = useState(false);
  const [submittingOneId, setSubmittingOneId] = useState(null);

  const [opened, setOpened] = useState(false);
  const [activeService, setActiveService] = useState(null);

  const filteredServices = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return services;

    return (services || []).filter((s) => {
      const name = String(s?.name ?? "").toLowerCase();
      const desc = String(s?.description ?? "").toLowerCase();
      return name.includes(term) || desc.includes(term);
    });
  }, [services, q]);

  const drafts = useMemo(() => {
    return (requests || []).filter((r) => String(r?.status) === "DRAFT");
  }, [requests]);

  const load = async () => {
    setLoading(true);
    try {
      const [s1, s2] = await Promise.all([api.get("/services"), api.get("/service-requests")]);

      const svcList = Array.isArray(s1.data?.data) ? s1.data.data : s1.data ?? [];
      const reqList = Array.isArray(s2.data?.data) ? s2.data.data : s2.data ?? [];

      setServices(svcList);
      setRequests(reqList);
    } catch (err) {
      const msg = err?.response?.data?.message || "Neuspešno učitavanje podataka.";
      notifications.show({ title: "Greška.", message: msg, color: "red" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  const startRequestForService = (serviceId) => {
    navigate(`/citizen/new-request?serviceId=${serviceId}`);
  };

  const submitOneDraft = async (id) => {
    setSubmittingOneId(id);
    try {
      await api.patch(`/service-requests/${id}/submit`);

      notifications.show({
        title: "Uspešno.",
        message: `Zahtev #${id} je poslat.`,
        color: "blue",
        icon: <IconCheck size={18} />,
      });

      await load();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        "Zahtev nije moguće poslati. Proverite status zahteva.";
      notifications.show({ title: "Greška.", message: msg, color: "red" });
    } finally {
      setSubmittingOneId(null);
    }
  };

  const submitAllDrafts = async () => {
    if (drafts.length === 0) {
      notifications.show({
        title: "Info.",
        message: "Nemate DRAFT zahteve za slanje.",
        color: "blue",
      });
      return;
    }

    setSubmittingAll(true);
    try {
      const results = await Promise.allSettled(
        drafts.map((r) => api.patch(`/service-requests/${r.id}/submit`))
      );

      const ok = results.filter((x) => x.status === "fulfilled").length;
      const fail = results.length - ok;

      notifications.show({
        title: "Završeno.",
        message: `Poslato: ${ok}. Neuspešno: ${fail}.`,
        color: fail > 0 ? "yellow" : "blue",
        icon: <IconCheck size={18} />,
      });

      await load();
    } catch (err) {
      const msg = err?.response?.data?.message || "Nije moguće poslati DRAFT zahteve.";
      notifications.show({ title: "Greška.", message: msg, color: "red" });
    } finally {
      setSubmittingAll(false);
    }
  };

  const downloadPdf = async (requestId) => {
    try {
      const res = await api.get(`/service-requests/${requestId}/pdf`, { responseType: "blob" });

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `zahtev-${requestId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);

      notifications.show({
        title: "PDF preuzet.",
        message: "Dokument je uspešno preuzet.",
        color: "blue",
        icon: <IconCheck size={18} />,
      });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        "PDF nije moguće preuzeti. Proverite da li zahtev postoji.";
      notifications.show({ title: "Greška.", message: msg, color: "red" });
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Slider />

      <div style={{ flex: 1 }}>
        <div className="auth-page" style={{ padding: 0 }}>
          <Container size="lg" py={24} style={{ position: "relative", zIndex: 1 }}>
            <Paper
              radius="xl"
              p="lg"
              style={{
                border: "1px solid rgba(11,31,59,0.12)",
                background: "rgba(255,255,255,0.92)",
                backdropFilter: "blur(8px)",
                marginBottom: 14,
              }}
            >
              <Group justify="space-between" align="center">
                <div>
                  <Title order={2} c={NAVY}>
                    Servisi.
                  </Title>
                  <Text c="dimmed" mt={2}>
                    Pokrenite novi zahtev ili pošaljite postojeće DRAFT zahteve.
                  </Text>
                </div>

                <Group gap="sm">
                  <Button
                    radius="xl"
                    variant="light"
                    color="blue"
                    leftSection={<IconSend size={16} />}
                    onClick={submitAllDrafts}
                    loading={submittingAll}
                  >
                    Pošalji sve DRAFT.
                  </Button>

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
            </Paper>

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
                <Group justify="center" py={28}>
                  <Loader />
                </Group>
              ) : (
                <Stack gap="lg">
                  <TextInput
                    leftSection={<IconSearch size={16} />}
                    placeholder="Pretraga servisa (naziv ili opis)."
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    radius="xl"
                  />

                  <Divider label="DRAFT zahtevi (za slanje)." labelPosition="center" />

                  <Card withBorder radius="xl" p="lg">
                    {drafts.length === 0 ? (
                      <Text c="dimmed">Trenutno nemate DRAFT zahteve.</Text>
                    ) : (
                      <Table striped highlightOnHover withTableBorder>
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th>ID.</Table.Th>
                            <Table.Th>Servis.</Table.Th>
                            <Table.Th>Status.</Table.Th>
                            <Table.Th>Taksa.</Table.Th>
                            <Table.Th>Akcije.</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {drafts.map((r) => (
                            <Table.Tr key={r.id}>
                              <Table.Td>{r.id}.</Table.Td>
                              <Table.Td>{r.service?.name ?? "-"}</Table.Td>
                              <Table.Td>
                                <StatusBadge status={r.status} />
                              </Table.Td>
                              <Table.Td>{Number(r.service?.fee ?? 0)} RSD.</Table.Td>
                              <Table.Td>
                                <Group gap="xs">
                                  <Button
                                    size="xs"
                                    radius="xl"
                                    variant="light"
                                    color="blue"
                                    leftSection={<IconSend size={14} />}
                                    onClick={() => submitOneDraft(r.id)}
                                    loading={submittingOneId === r.id}
                                  >
                                    Pošalji.
                                  </Button>

                                  <ActionIcon
                                    variant="light"
                                    color="blue"
                                    aria-label="pdf"
                                    onClick={() => downloadPdf(r.id)}
                                  >
                                    <IconDownload size={18} />
                                  </ActionIcon>
                                </Group>
                              </Table.Td>
                            </Table.Tr>
                          ))}
                        </Table.Tbody>
                      </Table>
                    )}
                  </Card>

                  <Divider label="Dostupni servisi." labelPosition="center" />

                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                    {filteredServices.map((svc) => (
                      <Card key={svc.id} radius="xl" withBorder>
                        <Group justify="space-between" align="flex-start">
                          <Box>
                            <Text fw={900} c={NAVY}>
                              {svc.name}.
                            </Text>
                            <Text c="dimmed" size="sm" mt={4} lineClamp={3}>
                              {svc.description ?? "-"}
                            </Text>
                          </Box>

                          <Badge variant="light" color="blue">
                            Taksa: {Number(svc.fee ?? 0)} RSD.
                          </Badge>
                        </Group>

                        <Group justify="space-between" mt="md">
                          <Button
                            size="xs"
                            radius="xl"
                            variant="subtle"
                            color="blue"
                            onClick={() => {
                              setActiveService(svc);
                              setOpened(true);
                            }}
                          >
                            Detalji.
                          </Button>

                          <Button
                            size="xs"
                            radius="xl"
                            variant="light"
                            color="blue"
                            leftSection={<IconPlus size={14} />}
                            onClick={() => startRequestForService(svc.id)}
                          >
                            Pokreni zahtev.
                          </Button>
                        </Group>
                      </Card>
                    ))}

                    {filteredServices.length === 0 && (
                      <Paper radius="xl" p="lg" style={{ border: "1px dashed rgba(11,31,59,0.25)" }}>
                        <Text c="dimmed">Nema servisa za prikaz po zadatoj pretrazi.</Text>
                      </Paper>
                    )}
                  </SimpleGrid>
                </Stack>
              )}
            </Paper>

            <Modal
              opened={opened}
              onClose={() => setOpened(false)}
              title={<Text fw={800} c={NAVY}>Detalji servisa.</Text>}
              radius="xl"
              centered
              size="lg"
            >
              <Stack gap="sm">
                <Text fw={800} c={NAVY}>
                  {activeService?.name ?? "-"}.
                </Text>

                <Text c="dimmed">{activeService?.description ?? "-"}</Text>

                <Group justify="space-between" mt="sm">
                  <Badge variant="light" color="blue">
                    Taksa: {Number(activeService?.fee ?? 0)} RSD.
                  </Badge>

                  <Button
                    radius="xl"
                    variant="light"
                    color="blue"
                    leftSection={<IconPlus size={16} />}
                    onClick={() => {
                      if (!activeService?.id) return;
                      setOpened(false);
                      startRequestForService(activeService.id);
                    }}
                  >
                    Pokreni zahtev.
                  </Button>
                </Group>
              </Stack>
            </Modal>
          </Container>
        </div>
      </div>
    </div>
  );
}
