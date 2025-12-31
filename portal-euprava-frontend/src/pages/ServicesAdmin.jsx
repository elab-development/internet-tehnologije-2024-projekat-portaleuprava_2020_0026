// src/pages/ServicesAdmin.jsx
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
  SegmentedControl,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Textarea,
  Switch,
  NumberInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconCheck,
  IconEdit,
  IconEye,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconTrash,
  IconX,
  IconListDetails,
  IconForms,
  IconBuilding,
} from "@tabler/icons-react";

import api from "../api/api";
import Slider from "../components/Slider";

const NAVY = "#0B1F3B";

function safeArr(x) {
  return Array.isArray(x) ? x : [];
}
function getListPayload(res) {
  return Array.isArray(res?.data?.data) ? res.data.data : res?.data ?? [];
}

function StatusBadge({ status }) {
  const map = {
    ACTIVE: { c: "green", t: "ACTIVE" },
    INACTIVE: { c: "gray", t: "INACTIVE" },
  };
  const s = map[status] ?? { c: "gray", t: status ?? "-" };
  return (
    <Badge color={s.c} variant="light">
      {s.t}.
    </Badge>
  );
}

function FieldTypeBadge({ t }) {
  const map = {
    STRING: "blue",
    NUMBER: "violet",
    DATE: "cyan",
    BOOLEAN: "teal",
    SELECT: "orange",
    FILE: "grape",
  };
  return (
    <Badge variant="light" color={map[t] ?? "gray"}>
      {t ?? "-"}.
    </Badge>
  );
}

export default function ServicesAdmin() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const selectedService = useMemo(
    () => (services || []).find((s) => String(s.id) === String(selectedServiceId)) || null,
    [services, selectedServiceId]
  );

  // Services filter
  const [search, setSearch] = useState("");

  // Fields
  const [fieldsLoading, setFieldsLoading] = useState(false);
  const [fields, setFields] = useState([]);

  // UI tabs in page: SERVICES | FIELDS
  const [section, setSection] = useState("SERVICES");

  // Service modal
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [serviceModalMode, setServiceModalMode] = useState("CREATE"); // CREATE | EDIT | VIEW
  const [serviceSelected, setServiceSelected] = useState(null);

  // Service form
  const [svcName, setSvcName] = useState("");
  const [svcDesc, setSvcDesc] = useState("");
  const [svcFee, setSvcFee] = useState(0);
  const [svcStatus, setSvcStatus] = useState("ACTIVE");
  const [svcInstitutionId, setSvcInstitutionId] = useState(null);
  const [svcRequiresAttachment, setSvcRequiresAttachment] = useState(false);

  // Institutions (for service create/edit)
  const [institutions, setInstitutions] = useState([]);
  const institutionsData = useMemo(() => {
    return safeArr(institutions).map((i) => ({ value: String(i.id), label: i.name }));
  }, [institutions]);

  // Field modal
  const [fieldModalOpen, setFieldModalOpen] = useState(false);
  const [fieldModalMode, setFieldModalMode] = useState("CREATE"); // CREATE | EDIT | VIEW
  const [fieldSelected, setFieldSelected] = useState(null);

  // Field form (match backend)
  const [fKey, setFKey] = useState("");
  const [fLabel, setFLabel] = useState("");
  const [fType, setFType] = useState("STRING"); // STRING,NUMBER,DATE,BOOLEAN,SELECT,FILE
  const [fRequired, setFRequired] = useState(false);
  const [fSortOrder, setFSortOrder] = useState(0);
  const [fOptionsRaw, setFOptionsRaw] = useState([]); // array of strings for SELECT
  const [fValidationRaw, setFValidationRaw] = useState([]); // array of strings/rules

  // Draft inputs for "creatable" behavior (Mantine version-safe).
  const [fOptionDraft, setFOptionDraft] = useState("");
  const [fValidationDraft, setFValidationDraft] = useState("");

  const addOption = (raw) => {
    const v = String(raw ?? "").trim();
    if (!v) return;
    setFOptionsRaw((prev) => Array.from(new Set([...(safeArr(prev).map(String)), v])));
    setFOptionDraft("");
  };

  const removeOption = (val) => {
    const t = String(val);
    setFOptionsRaw((prev) => safeArr(prev).map(String).filter((x) => x !== t));
  };

  const addValidationRule = (raw) => {
    const v = String(raw ?? "").trim();
    if (!v) return;
    setFValidationRaw((prev) => Array.from(new Set([...(safeArr(prev).map(String)), v])));
    setFValidationDraft("");
  };

  const removeValidationRule = (val) => {
    const t = String(val);
    setFValidationRaw((prev) => safeArr(prev).map(String).filter((x) => x !== t));
  };

  // Helper: load all services
  const loadServices = async () => {
    setLoading(true);
    try {
      const res = await api.get("/services");
      setServices(getListPayload(res));
    } catch (err) {
      notifications.show({
        title: "Greška.",
        message:
          err?.response?.data?.message ||
          "Nije moguće učitati servise. Proverite autorizaciju i konekciju.",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper: institutions for dropdown
  const loadInstitutions = async () => {
    try {
      const res = await api.get("/institutions");
      setInstitutions(getListPayload(res));
    } catch (e) {
      // ignore if fails
    }
  };

  // Helper: load fields for service
  const loadFields = async (serviceId) => {
    if (!serviceId) return;
    setFieldsLoading(true);
    try {
      const res = await api.get(`/services/${serviceId}/fields`);
      setFields(getListPayload(res));
    } catch (err) {
      notifications.show({
        title: "Greška.",
        message: err?.response?.data?.message || "Nije moguće učitati polja servisa.",
        color: "red",
      });
      setFields([]);
    } finally {
      setFieldsLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
    loadInstitutions();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (!selectedServiceId) {
      setFields([]);
      return;
    }
    loadFields(selectedServiceId);
    // eslint-disable-next-line
  }, [selectedServiceId]);

  // ===== Services: modal helpers =====
  const resetServiceForm = () => {
    setSvcName("");
    setSvcDesc("");
    setSvcFee(0);
    setSvcStatus("ACTIVE");
    setSvcInstitutionId(null);
    setSvcRequiresAttachment(false);
  };

  const closeServiceModal = () => {
    setServiceModalOpen(false);
    setServiceModalMode("CREATE");
    setServiceSelected(null);
    resetServiceForm();
  };

  const openServiceCreate = () => {
    setServiceModalMode("CREATE");
    setServiceSelected(null);
    resetServiceForm();
    setServiceModalOpen(true);
  };

  const openServiceView = async (row) => {
    setServiceModalMode("VIEW");
    setServiceSelected(row);
    setServiceModalOpen(true);

    try {
      const res = await api.get(`/services/${row.id}`);
      const full = res?.data?.data ?? res?.data ?? row;
      setServiceSelected(full);
    } catch (e) {
      // ignore
    }
  };

  const openServiceEdit = async (row) => {
    setServiceModalMode("EDIT");
    setServiceSelected(row);
    setServiceModalOpen(true);

    try {
      const res = await api.get(`/services/${row.id}`);
      const full = res?.data?.data ?? res?.data ?? row;

      setServiceSelected(full);
      setSvcName(full?.name ?? "");
      setSvcDesc(full?.description ?? "");
      setSvcFee(Number(full?.fee ?? 0));
      setSvcStatus(full?.status ?? "ACTIVE");
      setSvcInstitutionId(full?.institution?.id != null ? String(full.institution.id) : null);
      setSvcRequiresAttachment(!!full?.requires_attachment);
    } catch (e) {
      setSvcName(row?.name ?? "");
      setSvcDesc(row?.description ?? "");
      setSvcFee(Number(row?.fee ?? 0));
      setSvcStatus(row?.status ?? "ACTIVE");
      setSvcInstitutionId(row?.institution?.id != null ? String(row.institution.id) : null);
      setSvcRequiresAttachment(!!row?.requires_attachment);
    }
  };

  const validateServiceCreate = () => {
    if (!svcName.trim()) {
      notifications.show({ title: "Greška.", message: "Naziv servisa je obavezan.", color: "red" });
      return false;
    }
    return true;
  };

  const createService = async () => {
    if (!validateServiceCreate()) return;

    setSubmitting(true);
    try {
      const payload = {
        name: svcName.trim(),
        description: svcDesc.trim() || null,
        fee: Number(svcFee ?? 0),
        status: svcStatus,
        institution_id: svcInstitutionId ? Number(svcInstitutionId) : null,
        requires_attachment: !!svcRequiresAttachment,
      };

      await api.post("/services", payload);

      notifications.show({
        title: "Uspešno.",
        message: "Servis je kreiran.",
        icon: <IconCheck size={18} />,
        color: "blue",
      });

      closeServiceModal();
      await loadServices();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (err?.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(" ")
          : "Kreiranje servisa nije uspelo.");

      notifications.show({ title: "Greška.", message: msg, color: "red" });
    } finally {
      setSubmitting(false);
    }
  };

  const updateService = async () => {
    if (!serviceSelected?.id) return;

    setSubmitting(true);
    try {
      const payload = {
        name: svcName.trim(),
        description: svcDesc.trim() || null,
        fee: Number(svcFee ?? 0),
        status: svcStatus,
        institution_id: svcInstitutionId ? Number(svcInstitutionId) : null,
        requires_attachment: !!svcRequiresAttachment,
      };

      await api.put(`/services/${serviceSelected.id}`, payload);

      notifications.show({
        title: "Uspešno.",
        message: "Servis je izmenjen.",
        icon: <IconCheck size={18} />,
        color: "blue",
      });

      closeServiceModal();
      await loadServices();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (err?.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(" ")
          : "Izmena servisa nije uspela.");

      notifications.show({ title: "Greška.", message: msg, color: "red" });
    } finally {
      setSubmitting(false);
    }
  };

  const deleteService = async (row) => {
    const ok = window.confirm(`Obriši servis "${row?.name}"?`);
    if (!ok) return;

    try {
      await api.delete(`/services/${row.id}`);
      notifications.show({ title: "Uspešno.", message: "Servis je obrisan.", color: "blue" });

      if (String(selectedServiceId) === String(row.id)) {
        setSelectedServiceId(null);
        setFields([]);
      }

      loadServices();
    } catch (err) {
      notifications.show({
        title: "Greška.",
        message: err?.response?.data?.message || "Brisanje servisa nije uspelo.",
        color: "red",
      });
    }
  };

  // ===== Fields: modal helpers =====
  const resetFieldForm = () => {
    setFKey("");
    setFLabel("");
    setFType("STRING");
    setFRequired(false);
    setFSortOrder(0);
    setFOptionsRaw([]);
    setFValidationRaw([]);
    setFOptionDraft("");
    setFValidationDraft("");
  };

  const closeFieldModal = () => {
    setFieldModalOpen(false);
    setFieldModalMode("CREATE");
    setFieldSelected(null);
    resetFieldForm();
  };

  const openFieldCreate = () => {
    if (!selectedServiceId) {
      notifications.show({
        title: "Greška.",
        message: "Prvo izaberite servis za koji dodajete polja.",
        color: "red",
      });
      return;
    }

    setFieldModalMode("CREATE");
    setFieldSelected(null);
    resetFieldForm();

    // suggest next sort order
    const maxSort = Math.max(0, ...safeArr(fields).map((x) => Number(x.sort_order ?? 0)));
    setFSortOrder(maxSort + 1);

    setFieldModalOpen(true);
  };

  const openFieldView = async (row) => {
    setFieldModalMode("VIEW");
    setFieldSelected(row);
    setFieldModalOpen(true);
  };

  const openFieldEdit = async (row) => {
    setFieldModalMode("EDIT");
    setFieldSelected(row);
    setFieldModalOpen(true);

    setFKey(row?.key ?? "");
    setFLabel(row?.label ?? "");
    setFType(row?.data_type ?? "STRING");
    setFRequired(!!row?.is_required);
    setFSortOrder(Number(row?.sort_order ?? 0));

    // options/validation_rules are arrays in backend
    setFOptionsRaw(safeArr(row?.options));
    setFValidationRaw(safeArr(row?.validation_rules));
    setFOptionDraft("");
    setFValidationDraft("");
  };

  const validateFieldCreate = () => {
    if (!selectedServiceId) return false;

    if (!fKey.trim()) {
      notifications.show({ title: "Greška.", message: "Key je obavezan.", color: "red" });
      return false;
    }
    if (!fLabel.trim()) {
      notifications.show({ title: "Greška.", message: "Label je obavezan.", color: "red" });
      return false;
    }
    if (!fType) {
      notifications.show({ title: "Greška.", message: "Data type je obavezan.", color: "red" });
      return false;
    }
    if (fSortOrder == null || Number.isNaN(Number(fSortOrder)) || Number(fSortOrder) < 0) {
      notifications.show({ title: "Greška.", message: "Sort order mora biti 0 ili veći.", color: "red" });
      return false;
    }

    if (fType === "SELECT" && (!Array.isArray(fOptionsRaw) || fOptionsRaw.length === 0)) {
      notifications.show({
        title: "Greška.",
        message: "Za SELECT morate uneti bar jednu opciju.",
        color: "red",
      });
      return false;
    }

    return true;
  };

  const createField = async () => {
    if (!validateFieldCreate()) return;

    setSubmitting(true);
    try {
      const payload = {
        key: fKey.trim(),
        label: fLabel.trim(),
        data_type: fType,
        is_required: !!fRequired,
        options: fType === "SELECT" ? fOptionsRaw : null,
        validation_rules: fValidationRaw?.length ? fValidationRaw : null,
        sort_order: Number(fSortOrder),
      };

      await api.post(`/services/${selectedServiceId}/fields`, payload);

      notifications.show({
        title: "Uspešno.",
        message: "Polje je dodato.",
        icon: <IconCheck size={18} />,
        color: "blue",
      });

      closeFieldModal();
      loadFields(selectedServiceId);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (err?.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(" ")
          : "Dodavanje polja nije uspelo.");

      notifications.show({ title: "Greška.", message: msg, color: "red" });
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = async () => {
    if (!fieldSelected?.id) return;

    setSubmitting(true);
    try {
      const payload = {
        key: fKey.trim(),
        label: fLabel.trim(),
        data_type: fType,
        is_required: !!fRequired,
        options: fType === "SELECT" ? fOptionsRaw : null,
        validation_rules: fValidationRaw?.length ? fValidationRaw : null,
        sort_order: Number(fSortOrder),
      };

      await api.put(`/service-fields/${fieldSelected.id}`, payload);

      notifications.show({
        title: "Uspešno.",
        message: "Polje je izmenjeno.",
        icon: <IconCheck size={18} />,
        color: "blue",
      });

      closeFieldModal();
      loadFields(selectedServiceId);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (err?.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(" ")
          : "Izmena polja nije uspela.");

      notifications.show({ title: "Greška.", message: msg, color: "red" });
    } finally {
      setSubmitting(false);
    }
  };

  const deleteField = async (row) => {
    const ok = window.confirm(`Obriši polje "${row?.label}"?`);
    if (!ok) return;

    try {
      await api.delete(`/service-fields/${row.id}`);
      notifications.show({ title: "Uspešno.", message: "Polje je obrisano.", color: "blue" });
      loadFields(selectedServiceId);
    } catch (err) {
      notifications.show({
        title: "Greška.",
        message: err?.response?.data?.message || "Brisanje polja nije uspelo.",
        color: "red",
      });
    }
  };

  // ===== Page derived =====
  const servicesFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = safeArr(services);

    if (!q) return list;

    return list.filter((s) => {
      const hay = [s?.id, s?.name, s?.description, s?.status, s?.fee, s?.institution?.name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [services, search]);

  const serviceSelectData = useMemo(() => {
    return safeArr(services).map((s) => ({ value: String(s.id), label: s.name }));
  }, [services]);

  const serviceModalTitle =
    serviceModalMode === "CREATE"
      ? "Novi servis."
      : serviceModalMode === "EDIT"
      ? "Izmena servisa."
      : "Detalji servisa.";

  const fieldModalTitle =
    fieldModalMode === "CREATE"
      ? "Novo polje servisa."
      : fieldModalMode === "EDIT"
      ? "Izmena polja servisa."
      : "Detalji polja.";

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
                      Servisi – admin.
                    </Title>
                    <Text c="dimmed" mt={4}>
                      Upravljanje servisima i poljima forme.
                    </Text>
                  </div>

                  <Group>
                    <ActionIcon
                      variant="light"
                      color="blue"
                      radius="xl"
                      onClick={() => {
                        loadServices();
                        if (selectedServiceId) loadFields(selectedServiceId);
                      }}
                      aria-label="refresh"
                      style={{
                        border: "1px solid rgba(11,31,59,0.12)",
                        background: "rgba(255,255,255,0.70)",
                        backdropFilter: "blur(10px)",
                      }}
                    >
                      <IconRefresh size={18} />
                    </ActionIcon>

                    <Button radius="xl" color="blue" leftSection={<IconPlus size={16} />} onClick={openServiceCreate}>
                      Novi servis.
                    </Button>
                  </Group>
                </Group>
              </Box>
            </Paper>

            {/* Switch section */}
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
              <Group justify="space-between" align="center">
                <SegmentedControl
                  radius="xl"
                  value={section}
                  onChange={setSection}
                  data={[
                    { value: "SERVICES", label: "Servisi." },
                    { value: "FIELDS", label: "Polja servisa." },
                  ]}
                />

                {section === "FIELDS" && (
                  <Group gap="sm">
                    <Select
                      value={selectedServiceId}
                      onChange={setSelectedServiceId}
                      data={serviceSelectData}
                      placeholder="Izaberite servis."
                      searchable
                      clearable
                      radius="xl"
                      leftSection={<IconForms size={16} />}
                      style={{ minWidth: 320 }}
                    />
                    <Button
                      radius="xl"
                      variant="light"
                      color="blue"
                      leftSection={<IconPlus size={16} />}
                      onClick={openFieldCreate}
                      disabled={!selectedServiceId}
                    >
                      Novo polje.
                    </Button>
                  </Group>
                )}
              </Group>
            </Paper>

            {/* SERVICES section */}
            {section === "SERVICES" && (
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
                    <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
                      <TextInput
                        label="Pretraga."
                        placeholder="Naziv, opis, status, institucija."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        radius="xl"
                        leftSection={<IconSearch size={16} />}
                      />
                    </SimpleGrid>

                    <Divider />

                    <Table striped highlightOnHover withTableBorder>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>ID.</Table.Th>
                          <Table.Th>Naziv.</Table.Th>
                          <Table.Th>Status.</Table.Th>
                          <Table.Th>Taksa.</Table.Th>
                          <Table.Th>Institucija.</Table.Th>
                          <Table.Th>Prilog.</Table.Th>
                          <Table.Th>Akcije.</Table.Th>
                        </Table.Tr>
                      </Table.Thead>

                      <Table.Tbody>
                        {servicesFiltered.map((s) => (
                          <Table.Tr key={s.id}>
                            <Table.Td>{s.id}.</Table.Td>

                            <Table.Td>
                              <Text fw={800} c={NAVY}>
                                {s.name ?? "-"}.
                              </Text>
                              <Text size="sm" c="dimmed" lineClamp={2}>
                                {(s.description ?? "").trim() ? `${s.description}.` : "Bez opisa."}
                              </Text>
                            </Table.Td>

                            <Table.Td>
                              <StatusBadge status={s.status} />
                            </Table.Td>

                            <Table.Td>{Number(s.fee ?? 0)} RSD.</Table.Td>

                            <Table.Td>{s?.institution?.name ?? "-"}</Table.Td>

                            <Table.Td>
                              <Badge variant="light" color={s.requires_attachment ? "blue" : "gray"}>
                                {s.requires_attachment ? "DA." : "NE."}
                              </Badge>
                            </Table.Td>

                            <Table.Td>
                              <Group gap="xs">
                                <Button
                                  size="xs"
                                  radius="xl"
                                  variant="light"
                                  color="blue"
                                  leftSection={<IconEye size={16} />}
                                  onClick={() => openServiceView(s)}
                                >
                                  Detalji.
                                </Button>

                                <Button
                                  size="xs"
                                  radius="xl"
                                  variant="light"
                                  color="blue"
                                  leftSection={<IconEdit size={16} />}
                                  onClick={() => openServiceEdit(s)}
                                >
                                  Izmeni.
                                </Button>

                                <ActionIcon
                                  variant="light"
                                  color="red"
                                  radius="xl"
                                  aria-label="delete"
                                  onClick={() => deleteService(s)}
                                >
                                  <IconTrash size={18} />
                                </ActionIcon>
                              </Group>
                            </Table.Td>
                          </Table.Tr>
                        ))}

                        {servicesFiltered.length === 0 && (
                          <Table.Tr>
                            <Table.Td colSpan={7}>
                              <Text c="dimmed">Nema servisa za prikaz.</Text>
                            </Table.Td>
                          </Table.Tr>
                        )}
                      </Table.Tbody>
                    </Table>
                  </Stack>
                )}
              </Paper>
            )}

            {/* FIELDS section */}
            {section === "FIELDS" && (
              <Paper
                radius="xl"
                p="lg"
                style={{
                  border: "1px solid rgba(11,31,59,0.12)",
                  background: "rgba(255,255,255,0.90)",
                  backdropFilter: "blur(8px)",
                }}
              >
                {!selectedServiceId ? (
                  <Text c="dimmed">Izaberite servis da bi se prikazala polja.</Text>
                ) : fieldsLoading ? (
                  <Group justify="center" py={26}>
                    <Loader />
                  </Group>
                ) : (
                  <Stack gap="md">
                    <Group justify="space-between" align="center">
                      <div>
                        <Title order={4} c={NAVY}>
                          Polja servisa.
                        </Title>
                        <Text c="dimmed" size="sm">
                          Servis: {selectedService?.name ?? "-"}.
                        </Text>
                      </div>

                      <Badge variant="light" color="blue">
                        Ukupno: {fields.length}.
                      </Badge>
                    </Group>

                    <Divider />

                    <Table striped highlightOnHover withTableBorder>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Sort.</Table.Th>
                          <Table.Th>Key.</Table.Th>
                          <Table.Th>Label.</Table.Th>
                          <Table.Th>Tip.</Table.Th>
                          <Table.Th>Obavezno.</Table.Th>
                          <Table.Th>Opcije.</Table.Th>
                          <Table.Th>Akcije.</Table.Th>
                        </Table.Tr>
                      </Table.Thead>

                      <Table.Tbody>
                        {fields.map((f) => (
                          <Table.Tr key={f.id}>
                            <Table.Td>{Number(f.sort_order ?? 0)}.</Table.Td>
                            <Table.Td>
                              <Text fw={800} c={NAVY}>
                                {f.key ?? "-"}.
                              </Text>
                            </Table.Td>
                            <Table.Td>{f.label ?? "-"}</Table.Td>
                            <Table.Td>
                              <FieldTypeBadge t={f.data_type} />
                            </Table.Td>
                            <Table.Td>
                              <Badge variant="light" color={f.is_required ? "blue" : "gray"}>
                                {f.is_required ? "DA." : "NE."}
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              {f.data_type === "SELECT" ? (
                                <Text size="sm" c="dimmed" lineClamp={2}>
                                  {safeArr(f.options).length ? safeArr(f.options).join(", ") : "-"}
                                </Text>
                              ) : (
                                <Text size="sm" c="dimmed">
                                  -.
                                </Text>
                              )}
                            </Table.Td>

                            <Table.Td>
                              <Group gap="xs">
                                <Button
                                  size="xs"
                                  radius="xl"
                                  variant="light"
                                  color="blue"
                                  leftSection={<IconEye size={16} />}
                                  onClick={() => openFieldView(f)}
                                >
                                  Detalji.
                                </Button>

                                <Button
                                  size="xs"
                                  radius="xl"
                                  variant="light"
                                  color="blue"
                                  leftSection={<IconEdit size={16} />}
                                  onClick={() => openFieldEdit(f)}
                                >
                                  Izmeni.
                                </Button>

                                <ActionIcon
                                  variant="light"
                                  color="red"
                                  radius="xl"
                                  aria-label="delete"
                                  onClick={() => deleteField(f)}
                                >
                                  <IconTrash size={18} />
                                </ActionIcon>
                              </Group>
                            </Table.Td>
                          </Table.Tr>
                        ))}

                        {fields.length === 0 && (
                          <Table.Tr>
                            <Table.Td colSpan={7}>
                              <Text c="dimmed">Servis trenutno nema definisana polja.</Text>
                            </Table.Td>
                          </Table.Tr>
                        )}
                      </Table.Tbody>
                    </Table>
                  </Stack>
                )}
              </Paper>
            )}
          </Container>
        </div>
      </div>

      {/* Service Modal */}
      <Modal
        opened={serviceModalOpen}
        onClose={closeServiceModal}
        centered
        radius="xl"
        size="lg"
        title={
          <Group gap="sm">
            <IconListDetails size={18} color={NAVY} />
            <Text fw={900} c={NAVY}>
              {serviceModalTitle}
            </Text>
          </Group>
        }
      >
        <Stack gap="md">
          {serviceModalMode === "VIEW" && serviceSelected ? (
            <Card withBorder radius="xl" p="md">
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
                <Text>
                  <Text span fw={700} c={NAVY}>
                    ID:
                  </Text>{" "}
                  {serviceSelected.id}.
                </Text>
                <Text>
                  <Text span fw={700} c={NAVY}>
                    Status:
                  </Text>{" "}
                  {serviceSelected.status}.
                </Text>
                <Text>
                  <Text span fw={700} c={NAVY}>
                    Naziv:
                  </Text>{" "}
                  {serviceSelected.name ?? "-"}.
                </Text>
                <Text>
                  <Text span fw={700} c={NAVY}>
                    Taksa:
                  </Text>{" "}
                  {Number(serviceSelected.fee ?? 0)} RSD.
                </Text>
                <Text style={{ gridColumn: "1 / -1" }}>
                  <Text span fw={700} c={NAVY}>
                    Institucija:
                  </Text>{" "}
                  {serviceSelected?.institution?.name ?? "-"}.
                </Text>
                <Text style={{ gridColumn: "1 / -1" }}>
                  <Text span fw={700} c={NAVY}>
                    Opis:
                  </Text>{" "}
                  {(serviceSelected.description ?? "").trim() ? `${serviceSelected.description}.` : "Bez opisa."}
                </Text>
                <Text style={{ gridColumn: "1 / -1" }}>
                  <Text span fw={700} c={NAVY}>
                    Prilog:
                  </Text>{" "}
                  {serviceSelected.requires_attachment ? "DA." : "NE."}
                </Text>
              </SimpleGrid>
            </Card>
          ) : (
            <>
              <TextInput
                label="Naziv."
                placeholder="npr. Uverenje o državljanstvu."
                value={svcName}
                onChange={(e) => setSvcName(e.target.value)}
                radius="xl"
                required
              />

              <Textarea
                label="Opis."
                placeholder="Opišite servis."
                value={svcDesc}
                onChange={(e) => setSvcDesc(e.target.value)}
                radius="xl"
                autosize
                minRows={3}
              />

              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                <NumberInput label="Taksa (RSD)." value={svcFee} onChange={setSvcFee} radius="xl" min={0} />

                <Select
                  label="Status."
                  value={svcStatus}
                  onChange={(v) => setSvcStatus(v || "ACTIVE")}
                  data={[
                    { value: "ACTIVE", label: "ACTIVE." },
                    { value: "INACTIVE", label: "INACTIVE." },
                  ]}
                  radius="xl"
                />
              </SimpleGrid>

              <Select
                label="Institucija."
                placeholder="Izaberite (opciono, zavisi od backend pravila)."
                value={svcInstitutionId}
                onChange={setSvcInstitutionId}
                data={institutionsData}
                searchable
                clearable
                radius="xl"
              />

              <Switch
                checked={svcRequiresAttachment}
                onChange={(e) => setSvcRequiresAttachment(e.currentTarget.checked)}
                label="Servis zahteva prilog."
              />
            </>
          )}

          <Divider />

          <Group justify="flex-end" gap="xs">
            <Button radius="xl" variant="light" color="gray" leftSection={<IconX size={16} />} onClick={closeServiceModal}>
              Zatvori.
            </Button>

            {serviceModalMode !== "VIEW" && (
              <Button
                radius="xl"
                color="blue"
                loading={submitting}
                leftSection={<IconCheck size={16} />}
                onClick={serviceModalMode === "CREATE" ? createService : updateService}
              >
                {serviceModalMode === "CREATE" ? "Kreiraj." : "Sačuvaj."}
              </Button>
            )}
          </Group>
        </Stack>
      </Modal>

      {/* Field Modal */}
      <Modal
        opened={fieldModalOpen}
        onClose={closeFieldModal}
        centered
        radius="xl"
        size="lg"
        title={
          <Group gap="sm">
            <IconForms size={18} color={NAVY} />
            <Text fw={900} c={NAVY}>
              {fieldModalTitle}
            </Text>
          </Group>
        }
      >
        <Stack gap="md">
          {fieldModalMode === "VIEW" && fieldSelected ? (
            <Card withBorder radius="xl" p="md">
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
                <Text>
                  <Text span fw={700} c={NAVY}>
                    ID:
                  </Text>{" "}
                  {fieldSelected.id}.
                </Text>
                <Text>
                  <Text span fw={700} c={NAVY}>
                    Sort order:
                  </Text>{" "}
                  {Number(fieldSelected.sort_order ?? 0)}.
                </Text>
                <Text>
                  <Text span fw={700} c={NAVY}>
                    Key:
                  </Text>{" "}
                  {fieldSelected.key ?? "-"}.
                </Text>
                <Text>
                  <Text span fw={700} c={NAVY}>
                    Label:
                  </Text>{" "}
                  {fieldSelected.label ?? "-"}.
                </Text>
                <Text>
                  <Text span fw={700} c={NAVY}>
                    Tip:
                  </Text>{" "}
                  {fieldSelected.data_type ?? "-"}.
                </Text>
                <Text>
                  <Text span fw={700} c={NAVY}>
                    Obavezno:
                  </Text>{" "}
                  {fieldSelected.is_required ? "DA." : "NE."}
                </Text>

                <Text style={{ gridColumn: "1 / -1" }}>
                  <Text span fw={700} c={NAVY}>
                    Opcije:
                  </Text>{" "}
                  {safeArr(fieldSelected.options).length ? safeArr(fieldSelected.options).join(", ") : "-"}.
                </Text>

                <Text style={{ gridColumn: "1 / -1" }}>
                  <Text span fw={700} c={NAVY}>
                    Validation rules:
                  </Text>{" "}
                  {safeArr(fieldSelected.validation_rules).length
                    ? safeArr(fieldSelected.validation_rules).join(", ")
                    : "-"}
                  .
                </Text>
              </SimpleGrid>
            </Card>
          ) : (
            <>
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                <TextInput
                  label="Key."
                  placeholder="npr. purpose"
                  value={fKey}
                  onChange={(e) => setFKey(e.target.value)}
                  radius="xl"
                  required
                />

                <NumberInput
                  label="Sort order."
                  value={fSortOrder}
                  onChange={setFSortOrder}
                  radius="xl"
                  min={0}
                  required
                />
              </SimpleGrid>

              <TextInput
                label="Label."
                placeholder="npr. Svrha zahteva"
                value={fLabel}
                onChange={(e) => setFLabel(e.target.value)}
                radius="xl"
                required
              />

              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                <Select
                  label="Data type."
                  value={fType}
                  onChange={(v) => setFType(v || "STRING")}
                  data={[
                    { value: "STRING", label: "STRING." },
                    { value: "NUMBER", label: "NUMBER." },
                    { value: "DATE", label: "DATE." },
                    { value: "BOOLEAN", label: "BOOLEAN." },
                    { value: "SELECT", label: "SELECT." },
                    { value: "FILE", label: "FILE." },
                  ]}
                  radius="xl"
                  required
                />

                <Switch checked={fRequired} onChange={(e) => setFRequired(e.currentTarget.checked)} label="Obavezno polje." />
              </SimpleGrid>

              {fType === "SELECT" && (
                <>
                  <Group align="end" gap="sm">
                    <TextInput
                      label="Opcije (SELECT)."
                      placeholder="Unesite opciju i pritisnite Enter ili Dodaj."
                      value={fOptionDraft}
                      onChange={(e) => setFOptionDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addOption(fOptionDraft);
                        }
                      }}
                      radius="xl"
                      style={{ flex: 1 }}
                    />
                    <Button
                      radius="xl"
                      color="blue"
                      variant="light"
                      leftSection={<IconPlus size={16} />}
                      onClick={() => addOption(fOptionDraft)}
                    >
                      Dodaj.
                    </Button>
                  </Group>

                  <Group gap="xs">
                    {safeArr(fOptionsRaw).map((opt) => (
                      <Badge
                        key={String(opt)}
                        variant="light"
                        color="blue"
                        rightSection={
                          <ActionIcon
                            size="xs"
                            variant="subtle"
                            color="gray"
                            aria-label="remove-option"
                            onClick={() => removeOption(opt)}
                          >
                            <IconX size={12} />
                          </ActionIcon>
                        }
                      >
                        {String(opt)}.
                      </Badge>
                    ))}
                    {safeArr(fOptionsRaw).length === 0 && <Text size="sm" c="dimmed">Nema dodatih opcija.</Text>}
                  </Group>
                </>
              )}

              <Group align="end" gap="sm">
                <TextInput
                  label="Validation rules (opciono)."
                  placeholder='npr. email, min:6'
                  value={fValidationDraft}
                  onChange={(e) => setFValidationDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addValidationRule(fValidationDraft);
                    }
                  }}
                  radius="xl"
                  style={{ flex: 1 }}
                />
                <Button
                  radius="xl"
                  color="blue"
                  variant="light"
                  leftSection={<IconPlus size={16} />}
                  onClick={() => addValidationRule(fValidationDraft)}
                >
                  Dodaj.
                </Button>
              </Group>

              <Group gap="xs">
                {safeArr(fValidationRaw).map((r) => (
                  <Badge
                    key={String(r)}
                    variant="light"
                    color="gray"
                    rightSection={
                      <ActionIcon
                        size="xs"
                        variant="subtle"
                        color="gray"
                        aria-label="remove-rule"
                        onClick={() => removeValidationRule(r)}
                      >
                        <IconX size={12} />
                      </ActionIcon>
                    }
                  >
                    {String(r)}.
                  </Badge>
                ))}
                {safeArr(fValidationRaw).length === 0 && <Text size="sm" c="dimmed">Nema dodatih pravila.</Text>}
              </Group>
            </>
          )}

          <Divider />

          <Group justify="flex-end" gap="xs">
            <Button radius="xl" variant="light" color="gray" leftSection={<IconX size={16} />} onClick={closeFieldModal}>
              Zatvori.
            </Button>

            {fieldModalMode !== "VIEW" && (
              <Button
                radius="xl"
                color="blue"
                loading={submitting}
                leftSection={<IconCheck size={16} />}
                onClick={fieldModalMode === "CREATE" ? createField : updateField}
              >
                {fieldModalMode === "CREATE" ? "Dodaj." : "Sačuvaj."}
              </Button>
            )}
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}
