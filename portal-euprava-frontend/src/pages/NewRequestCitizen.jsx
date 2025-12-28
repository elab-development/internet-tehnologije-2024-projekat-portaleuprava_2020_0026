// src/pages/NewRequestCitizen.jsx

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
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
  NumberInput,
  Switch,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { Dropzone } from "@mantine/dropzone";
import { notifications } from "@mantine/notifications";
import {
  IconArrowLeft,
  IconCheck,
  IconClipboardText,
  IconFile,
  IconRefresh,
  IconSend,
  IconUpload,
  IconX,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";

import api from "../api/api";
import Slider from "../components/Slider";

const NAVY = "#0B1F3B";

/**
 * FieldRenderer radi sa field shape-om iz backend-a:
 * field = { id, label, name, type, required, options[] }
 *
 * VAŽNO:
 * - Da se ne bi desilo da se 2 različita polja "prepišu" (npr. broj kopija i način dostave),
 *   state mapiramo po UNIQUE ključu: field.id (fallback: field.name).
 * - Backend u form_data i dalje šaljemo kao objekat po field.name (jer tvoj controller očekuje array),
 *   ali interno koristimo mapu po id-u, pa je UI stabilan.
 */

function toYmd(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function FieldRenderer({ field, value, onChange }) {
  const type = String(field?.type || "text").toLowerCase();
  const label = (field?.label || field?.name || "Polje") + ".";
  const required = !!field?.required;

  if (type === "textarea") {
    return (
      <Textarea
        label={label}
        placeholder="Unesite vrednost."
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        autosize
        minRows={3}
        required={required}
      />
    );
  }

  if (type === "number") {
    // Mantine NumberInput vraća number | string | null (zavisi od verzije).
    // Nama je OK da čuvamo number ili null.
    return (
      <NumberInput
        label={label}
        placeholder="Unesite broj."
        value={value ?? null}
        onChange={onChange}
        required={required}
        min={0}
      />
    );
  }

  if (type === "date") {
    const parsed = value ? new Date(value) : null;

    return (
      <DatePickerInput
        label={label}
        placeholder="Izaberite datum."
        value={parsed}
        onChange={(d) => (d ? onChange(toYmd(d)) : onChange(null))}
        required={required}
        valueFormat="YYYY-MM-DD"
        clearable
      />
    );
  }

  if (type === "select") {
    const options = Array.isArray(field?.options) ? field.options : [];
    const data = options.map((o) =>
      typeof o === "string" ? { value: o, label: o } : o
    );

    return (
      <Select
        label={label}
        placeholder="Izaberite opciju."
        data={data}
        value={value ?? null}
        onChange={onChange}
        required={required}
        searchable
        clearable
      />
    );
  }

  if (type === "checkbox" || type === "boolean") {
    return (
      <Box>
        <Text fw={600} c={NAVY} size="sm" mb={6}>
          {label}
        </Text>
        <Switch
          checked={!!value}
          onChange={(e) => onChange(e.currentTarget.checked)}
          label="Da."
        />
      </Box>
    );
  }

  return (
    <TextInput
      label={label}
      placeholder="Unesite vrednost."
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      required={required}
    />
  );
}

export default function NewRequestCitizen() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [selectedService, setSelectedService] = useState(null);

  const [fieldsLoading, setFieldsLoading] = useState(false);
  const [fields, setFields] = useState([]);

  const [citizenNote, setCitizenNote] = useState("");

  // UI state: map by unique field key (id fallback name) to avoid "prepisivanje".
  const [valuesByKey, setValuesByKey] = useState({});

  // Attachment link stored in DB.
  const [attachmentLink, setAttachmentLink] = useState(null);
  const [uploading, setUploading] = useState(false);

  const serviceSelectData = useMemo(() => {
    return (services || []).map((s) => ({
      value: String(s.id),
      label: s.name,
    }));
  }, [services]);

  const quickInfo = useMemo(() => {
    if (!selectedService) return null;
    return {
      fee: selectedService.fee ?? 0,
      name: selectedService.name ?? "",
      desc: selectedService.description ?? "",
    };
  }, [selectedService]);

  const loadServices = async () => {
    setLoading(true);
    try {
      const res = await api.get("/services");
      const list = Array.isArray(res.data?.data) ? res.data.data : res.data ?? [];
      setServices(list);
    } finally {
      setLoading(false);
    }
  };

  const getFieldKey = (f) => String(f?.id ?? f?.name);

  const loadFields = async (serviceId) => {
    setFieldsLoading(true);
    try {
      const res = await api.get(`/services/${serviceId}/fields`);
      const list = Array.isArray(res.data?.data) ? res.data.data : res.data ?? [];
      setFields(list);

      // Reset values and attachment when service changes.
      const initial = {};
      list.forEach((f) => {
        const key = getFieldKey(f);
        const t = String(f.type || "text").toLowerCase();
        initial[key] = t === "checkbox" || t === "boolean" ? false : "";
      });

      setValuesByKey(initial);
      setCitizenNote("");
      setAttachmentLink(null);
    } finally {
      setFieldsLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (!selectedServiceId) {
      setSelectedService(null);
      setFields([]);
      setValuesByKey({});
      setCitizenNote("");
      setAttachmentLink(null);
      return;
    }

    const svc = services.find((s) => String(s.id) === String(selectedServiceId));
    setSelectedService(svc || null);
    loadFields(selectedServiceId);
    // eslint-disable-next-line
  }, [selectedServiceId]);

  const validateClientSide = () => {
    for (const f of fields) {
      if (!f.required) continue;

      const key = getFieldKey(f);
      const v = valuesByKey?.[key];

      const empty =
        v === null ||
        v === undefined ||
        (typeof v === "string" && v.trim() === "") ||
        (typeof v === "number" && Number.isNaN(v));

      if (empty) {
        notifications.show({
          title: "Greška.",
          message: `Polje "${f.label || f.name}" je obavezno.`,
          color: "red",
        });
        return false;
      }
    }
    return true;
  };

  // Convert UI values (by key) -> payload form_data (by field.name).
  const buildFormDataPayload = () => {
    const out = {};
    (fields || []).forEach((f) => {
      const name = f?.name;
      if (!name) return;

      const key = getFieldKey(f);
      let v = valuesByKey?.[key];

      // Normalize number empty to null.
      const t = String(f.type || "text").toLowerCase();
      if (t === "number") {
        if (v === "" || v === undefined) v = null;
      }

      out[name] = v;
    });
    return out;
  };

  const uploadFile = async (file) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await api.post("/uploads/filebin", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const link = res?.data?.link;

      if (!link) {
        throw new Error("Filebin nije vratio link.");
      }

      setAttachmentLink(link);

      notifications.show({
        title: "Upload uspešan.",
        message: "Fajl je otpremljen i link je sačuvan.",
        color: "blue",
      });
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "Upload nije uspeo.";

      notifications.show({
        title: "Greška.",
        message: msg,
        color: "red",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedServiceId) {
      notifications.show({
        title: "Greška.",
        message: "Morate izabrati servis.",
        color: "red",
      });
      return;
    }

    if (!validateClientSide()) return;

    setSubmitting(true);
    try {
      const payload = {
        service_id: Number(selectedServiceId),
        citizen_note: citizenNote || null,
        attachment: attachmentLink || null,
        form_data: buildFormDataPayload(),
      };

      await api.post("/service-requests", payload);

      notifications.show({
        title: "Uspešno.",
        message: "Zahtev je kreiran kao DRAFT.",
        icon: <IconCheck size={18} />,
        color: "blue",
      });

      navigate("/home-citizen", { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (err?.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(" ")
          : "Kreiranje zahteva nije uspelo.");

      notifications.show({
        title: "Greška.",
        message: msg,
        color: "red",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Slider />

      <div style={{ flex: 1 }}>
        <div className="auth-page" style={{ padding: 0 }}>
          <Container size="lg" py={24} style={{ position: "relative", zIndex: 1 }}>
            {/* Header */}
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
                      Novi zahtev.
                    </Title>
                    <Text c="dimmed" mt={2}>
                      Izaberite servis i popunite tražene podatke.
                    </Text>
                  </div>
                </Group>

                <ActionIcon
                  variant="light"
                  color="blue"
                  radius="xl"
                  onClick={loadServices}
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

            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
              {/* Left: service selection + info */}
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
                    <Group gap="sm" align="center">
                      <IconClipboardText size={18} color={NAVY} />
                      <Title order={4} c={NAVY}>
                        Izbor servisa.
                      </Title>
                    </Group>

                    <Select
                      label="Servis."
                      placeholder="Izaberite servis."
                      data={serviceSelectData}
                      value={selectedServiceId}
                      onChange={setSelectedServiceId}
                      searchable
                      clearable
                      required
                    />

                    {selectedService && (
                      <Card radius="xl" withBorder>
                        <Group justify="space-between" align="flex-start">
                          <div>
                            <Text fw={800} c={NAVY}>
                              {quickInfo?.name}.
                            </Text>
                            <Text c="dimmed" size="sm" mt={4} lineClamp={3}>
                              {quickInfo?.desc || "-"}
                            </Text>
                          </div>

                          <Badge variant="light" color="blue">
                            Taksa: {quickInfo?.fee ?? 0} RSD.
                          </Badge>
                        </Group>

                        <Divider my="md" />

                        <Text size="sm" c="dimmed">
                          Nakon kreiranja, zahtev ostaje u statusu DRAFT. Možete ga kasnije poslati iz liste zahteva.
                        </Text>
                      </Card>
                    )}
                  </Stack>
                )}
              </Paper>

              {/* Right: dynamic form */}
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
                  <Title order={4} c={NAVY}>
                    Podaci zahteva.
                  </Title>

                  {!selectedServiceId ? (
                    <Text c="dimmed">
                      Prvo izaberite servis sa leve strane da bi se prikazala polja.
                    </Text>
                  ) : fieldsLoading ? (
                    <Group justify="center" py={26}>
                      <Loader />
                    </Group>
                  ) : (
                    <>
                      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                        {(fields || []).map((f) => {
                          const key = getFieldKey(f);
                          const isTextarea = String(f.type || "").toLowerCase() === "textarea";

                          return (
                            <Box
                              key={key}
                              style={{
                                gridColumn: isTextarea ? "1 / -1" : undefined,
                              }}
                            >
                              <FieldRenderer
                                field={f}
                                value={valuesByKey?.[key]}
                                onChange={(v) =>
                                  setValuesByKey((prev) => ({ ...prev, [key]: v }))
                                }
                              />
                            </Box>
                          );
                        })}
                      </SimpleGrid>

                      {/* Upload */}
                      <Paper
                        radius="xl"
                        p="md"
                        style={{
                          border: "1px dashed rgba(11,31,59,0.25)",
                          background: "rgba(11,31,59,0.03)",
                        }}
                      >
                        <Text fw={800} c={NAVY} mb={8}>
                          Prilog (opciono).
                        </Text>

                        <Dropzone
                          onDrop={(files) => uploadFile(files[0])}
                          onReject={() =>
                            notifications.show({
                              title: "Greška.",
                              message: "Fajl nije prihvaćen.",
                              color: "red",
                            })
                          }
                          maxSize={25 * 1024 * 1024}
                          multiple={false}
                          loading={uploading}
                          accept={["application/pdf", "image/*", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]}
                          styles={{
                            root: {
                              borderRadius: 16,
                              padding: 18,
                              background: "rgba(255,255,255,0.85)",
                              border: "1px solid rgba(11,31,59,0.10)",
                            },
                          }}
                        >
                          <Group justify="center" gap="md" style={{ pointerEvents: "none" }}>
                            <Dropzone.Accept>
                              <IconUpload size={26} color={NAVY} />
                            </Dropzone.Accept>
                            <Dropzone.Reject>
                              <IconX size={26} color="red" />
                            </Dropzone.Reject>
                            <Dropzone.Idle>
                              <IconFile size={26} color={NAVY} />
                            </Dropzone.Idle>

                            <Stack gap={2} align="center">
                              <Text fw={700} c={NAVY}>
                                Prevucite fajl ovde ili kliknite da izaberete.
                              </Text>
                              <Text size="sm" c="dimmed">
                                Maksimalno 25MB. Link se čuva u zahtevu.
                              </Text>
                            </Stack>
                          </Group>
                        </Dropzone>

                        {attachmentLink && (
                          <Group justify="space-between" mt="md">
                            <Text size="sm" c="dimmed">
                              Sačuvan link.
                            </Text>
                            <a href={attachmentLink} target="_blank" rel="noreferrer">
                              <Text size="sm" fw={700} c={NAVY}>
                                Otvori prilog.
                              </Text>
                            </a>
                          </Group>
                        )}
                      </Paper>

                      <Textarea
                        label="Napomena građanina."
                        placeholder="Opciono. Npr. dodatne informacije za službenika."
                        value={citizenNote}
                        onChange={(e) => setCitizenNote(e.target.value)}
                        autosize
                        minRows={3}
                      />

                      <Group justify="flex-end" mt="sm">
                        <Button
                          radius="xl"
                          leftSection={<IconSend size={16} />}
                          onClick={handleSubmit}
                          loading={submitting}
                        >
                          Kreiraj zahtev.
                        </Button>
                      </Group>
                    </>
                  )}
                </Stack>
              </Paper>
            </SimpleGrid>
          </Container>
        </div>
      </div>
    </div>
  );
}
