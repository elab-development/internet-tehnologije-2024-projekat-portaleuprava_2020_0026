// src/pages/MyRequestsCitizen.jsx
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
  Pagination,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconArrowLeft,
  IconCheck,
  IconDownload,
  IconEye,
  IconRefresh,
  IconX,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";

import api from "../api/api";
import Slider from "../components/Slider";

const NAVY = "#0B1F3B";
const PAGE_SIZE = 5;

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

function PaymentBadge({ status }) {
  const map = {
    NOT_REQUIRED: { c: "gray", t: "NOT_REQUIRED" },
    NOT_PAID: { c: "red", t: "NOT_PAID" },
    PENDING: { c: "yellow", t: "PENDING" },
    PAID: { c: "green", t: "PAID" },
  };
  const s = map[status] ?? { c: "gray", t: status ?? "-" };
  return (
    <Badge color={s.c} variant="light">
      {s.t}.
    </Badge>
  );
}

function fmtDateTime(val) {
  if (!val) return "-";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return String(val);
  return d.toLocaleString();
}

function formatAnyValue(v) {
  if (v === null || v === undefined || v === "") return "-";
  if (typeof v === "boolean") return v ? "Da." : "Ne.";
  if (typeof v === "number") return String(v);
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

export default function MyRequestsCitizen() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priceSort, setPriceSort] = useState("FEE_DESC"); // FEE_ASC | FEE_DESC

  const [page, setPage] = useState(1);

  // Modal.
  const [opened, setOpened] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [details, setDetails] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/service-requests");
      const list = Array.isArray(res.data?.data) ? res.data.data : res.data ?? [];
      setRequests(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  // Reset page on filter/sort change.
  useEffect(() => {
    setPage(1);
  }, [statusFilter, priceSort]);

  const statusOptions = useMemo(
    () => [
      { value: "ALL", label: "Svi statusi." },
      { value: "DRAFT", label: "DRAFT." },
      { value: "SUBMITTED", label: "SUBMITTED." },
      { value: "IN_REVIEW", label: "IN_REVIEW." },
      { value: "APPROVED", label: "APPROVED." },
      { value: "REJECTED", label: "REJECTED." },
    ],
    []
  );

  const sortOptions = useMemo(
    () => [
      { value: "FEE_DESC", label: "Cena: opadajuće." },
      { value: "FEE_ASC", label: "Cena: rastuće." },
    ],
    []
  );

  const filteredSorted = useMemo(() => {
    let arr = Array.isArray(requests) ? [...requests] : [];

    if (statusFilter && statusFilter !== "ALL") {
      arr = arr.filter((r) => String(r?.status) === String(statusFilter));
    }

    arr.sort((a, b) => {
      const feeA = Number(a?.service?.fee ?? a?.service_fee ?? 0);
      const feeB = Number(b?.service?.fee ?? b?.service_fee ?? 0);

      if (priceSort === "FEE_ASC") return feeA - feeB;
      return feeB - feeA;
    });

    return arr;
  }, [requests, statusFilter, priceSort]);

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / PAGE_SIZE));
  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredSorted.slice(start, start + PAGE_SIZE);
  }, [filteredSorted, page]);

  const downloadPdf = async (requestId) => {
    try {
      const res = await api.get(`/service-requests/${requestId}/pdf`, {
        responseType: "blob",
      });

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
      notifications.show({
        title: "Greška.",
        message: "PDF nije moguće preuzeti.",
        color: "red",
        icon: <IconX size={18} />,
      });
    }
  };

  const openDetails = async (id) => {
    setOpened(true);
    setSelectedId(id);
    setDetails(null);
    setDetailsLoading(true);

    try {
      const res = await api.get(`/service-requests/${id}`);
      const data = res.data?.data ?? res.data ?? null;
      setDetails(data);
    } catch (err) {
      notifications.show({
        title: "Greška.",
        message: "Nije moguće učitati detalje zahteva.",
        color: "red",
      });
      setOpened(false);
      setSelectedId(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Build universal rows based on service.fields (preferred), and then add extra keys if exist.
  const detailRows = useMemo(() => {
    const sr = details;
    if (!sr) return [];

    const formData = sr?.form_data ?? {};
    const fields = sr?.service?.fields ?? [];

    const rows = [];
    const usedKeys = new Set();

    if (Array.isArray(fields) && fields.length > 0) {
      fields.forEach((f) => {
        const key = String(f?.key ?? f?.name ?? "");
        if (!key) return;

        const label = String(f?.label ?? f?.name ?? f?.key ?? key);
        const val = formData?.[key];

        rows.push({
          key,
          label,
          value: val,
        });

        usedKeys.add(key);
      });
    }

    // Add extra keys that exist in form_data but are not defined in fields.
    if (formData && typeof formData === "object" && !Array.isArray(formData)) {
      Object.keys(formData).forEach((k) => {
        if (usedKeys.has(k)) return;
        rows.push({
          key: k,
          label: k,
          value: formData[k],
        });
      });
    }

    return rows;
  }, [details]);

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
                <Group gap="sm">
                  <ActionIcon
                    variant="light"
                    radius="xl"
                    onClick={() => navigate(-1)}
                    style={{
                      border: "1px solid rgba(11,31,59,0.12)",
                      background: "rgba(11,31,59,0.06)",
                    }}
                    aria-label="back"
                  >
                    <IconArrowLeft size={18} color={NAVY} />
                  </ActionIcon>

                  <div>
                    <Title order={2} c={NAVY}>
                      Moji zahtevi.
                    </Title>
                    <Text c="dimmed" mt={2}>
                      Pregled svih vaših zahteva, filtriranje, sortiranje i detalji.
                    </Text>
                  </div>
                </Group>

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
              <Stack gap="md">
                <Group justify="space-between" align="flex-end" wrap="wrap">
                  <Group gap="md" wrap="wrap">
                    <Select
                      label="Status."
                      data={statusOptions}
                      value={statusFilter}
                      onChange={(v) => setStatusFilter(v || "ALL")}
                      w={240}
                    />

                    <Select
                      label="Sortiranje po ceni."
                      data={sortOptions}
                      value={priceSort}
                      onChange={(v) => setPriceSort(v || "FEE_DESC")}
                      w={240}
                    />
                  </Group>

                  <Button
                    radius="xl"
                    variant="light"
                    color="blue"
                    onClick={() => navigate("/citizen/new-request")}
                  >
                    Novi zahtev.
                  </Button>
                </Group>

                <Divider />

                {loading ? (
                  <Group justify="center" py={30}>
                    <Loader />
                  </Group>
                ) : (
                  <>
                    <Table striped highlightOnHover withTableBorder>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>ID.</Table.Th>
                          <Table.Th>Servis.</Table.Th>
                          <Table.Th>Datum.</Table.Th>
                          <Table.Th>Status.</Table.Th>
                          <Table.Th>Cena.</Table.Th>
                          <Table.Th>Plaćanje.</Table.Th>
                          <Table.Th>Akcije.</Table.Th>
                        </Table.Tr>
                      </Table.Thead>

                      <Table.Tbody>
                        {pageItems.map((r) => {
                          const fee = Number(r?.service?.fee ?? r?.service_fee ?? 0);
                          return (
                            <Table.Tr key={r.id}>
                              <Table.Td>{r.id}.</Table.Td>
                              <Table.Td>{r?.service?.name ?? r?.service_name ?? "-"}</Table.Td>
                              <Table.Td>{fmtDateTime(r?.created_at)}</Table.Td>
                              <Table.Td>
                                <StatusBadge status={r?.status} />
                              </Table.Td>
                              <Table.Td>{fee} RSD.</Table.Td>
                              <Table.Td>
                                <PaymentBadge status={r?.payment_status} />
                              </Table.Td>
                              <Table.Td>
                                <Group gap={8}>
                                  <ActionIcon
                                    variant="light"
                                    color="blue"
                                    aria-label="details"
                                    onClick={() => openDetails(r.id)}
                                  >
                                    <IconEye size={18} />
                                  </ActionIcon>

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
                          );
                        })}

                        {pageItems.length === 0 && (
                          <Table.Tr>
                            <Table.Td colSpan={7}>
                              <Text c="dimmed">Nema zahteva za izabrane filtere.</Text>
                            </Table.Td>
                          </Table.Tr>
                        )}
                      </Table.Tbody>
                    </Table>

                    <Group justify="space-between" align="center" mt="sm" wrap="wrap">
                      <Text c="dimmed" size="sm">
                        Prikaz: {filteredSorted.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(
                          page * PAGE_SIZE,
                          filteredSorted.length
                        )} od {filteredSorted.length}.
                      </Text>

                      <Pagination
                        value={page}
                        onChange={setPage}
                        total={totalPages}
                        radius="xl"
                      />
                    </Group>
                  </>
                )}
              </Stack>
            </Paper>
          </Container>
        </div>
      </div>

      {/* DETAILS MODAL */}
      <Modal
        opened={opened}
        onClose={() => {
          setOpened(false);
          setSelectedId(null);
          setDetails(null);
        }}
        title={
          <Text fw={800} c={NAVY}>
            Detalji zahteva {selectedId ? `#${selectedId}.` : "."}
          </Text>
        }
        centered
        size="lg"
        radius="xl"
      >
        {detailsLoading ? (
          <Group justify="center" py={18}>
            <Loader />
          </Group>
        ) : !details ? (
          <Text c="dimmed">Detalji nisu dostupni.</Text>
        ) : (
          <Stack gap="md">
            <Card withBorder radius="xl">
              <Group justify="space-between" align="flex-start" wrap="wrap">
                <Box>
                  <Text fw={800} c={NAVY}>
                    {details?.service?.name ?? "-"}.
                  </Text>
                  <Text c="dimmed" size="sm" mt={4}>
                    Kreirano: {fmtDateTime(details?.created_at)}.
                  </Text>
                  <Text c="dimmed" size="sm">
                    Ažurirano: {fmtDateTime(details?.updated_at)}.
                  </Text>
                </Box>

                <Group gap="sm">
                  <StatusBadge status={details?.status} />
                  <PaymentBadge status={details?.payment_status} />
                </Group>
              </Group>

              <Divider my="md" />

              <Group justify="space-between" wrap="wrap">
                <Text size="sm" c="dimmed">
                  Taksa:{" "}
                  <Text span fw={800} c={NAVY}>
                    {Number(details?.service?.fee ?? 0)} RSD.
                  </Text>
                </Text>

                {details?.attachment ? (
                  <Button
                    size="xs"
                    radius="xl"
                    variant="light"
                    color="blue"
                    component="a"
                    href={details.attachment}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Otvori prilog.
                  </Button>
                ) : (
                  <Text size="sm" c="dimmed">
                    Prilog: -.
                  </Text>
                )}
              </Group>

              {details?.citizen_note ? (
                <Text mt="md" size="sm">
                  <Text span fw={800} c={NAVY}>
                    Napomena građanina:
                  </Text>{" "}
                  {details.citizen_note}
                </Text>
              ) : null}

              {details?.officer_note ? (
                <Text mt="xs" size="sm">
                  <Text span fw={800} c={NAVY}>
                    Napomena službenika:
                  </Text>{" "}
                  {details.officer_note}
                </Text>
              ) : null}
            </Card>

            <Card withBorder radius="xl">
              <Group justify="space-between" mb="xs">
                <Title order={5} c={NAVY}>
                  Form data.
                </Title>
                <Text c="dimmed" size="sm">
                  Prikaz po definisanim poljima servisa.
                </Text>
              </Group>

              <Table withTableBorder striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Polje.</Table.Th>
                    <Table.Th>Vrednost.</Table.Th>
                  </Table.Tr>
                </Table.Thead>

                <Table.Tbody>
                  {detailRows.map((row) => (
                    <Table.Tr key={row.key}>
                      <Table.Td>
                        <Text fw={700} c={NAVY}>
                          {row.label}.
                        </Text>
                        <Text c="dimmed" size="xs">
                          {row.key}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text style={{ whiteSpace: "pre-wrap" }}>
                          {formatAnyValue(row.value)}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ))}

                  {detailRows.length === 0 && (
                    <Table.Tr>
                      <Table.Td colSpan={2}>
                        <Text c="dimmed">Nema form podataka.</Text>
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>

              <Group justify="flex-end" mt="md">
                <Button
                  radius="xl"
                  leftSection={<IconDownload size={16} />}
                  variant="light"
                  color="blue"
                  onClick={() => downloadPdf(details?.id)}
                >
                  Preuzmi PDF.
                </Button>
              </Group>
            </Card>
          </Stack>
        )}
      </Modal>
    </div>
  );
}
