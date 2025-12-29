// src/components/FormDataPretty.jsx
import React, { useMemo } from "react";
import { Alert, Badge, Group, ScrollArea, Table, Text } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";

const NAVY = "#0B1F3B";

/**
 * FormDataPretty
 * - Prikazuje form_data na univerzalan način (key/value tabela).
 * - Ako je prosleđen service sa service.fields (ili service.fields.data), koristi ta polja
 *   da prikaže LEPA imena (label) i redosled kao u definiciji polja.
 *
 * Očekivani inputi:
 *  - formData: objekat (npr. {"delivery_method":"POST","purpose":"...","contact_phone":"..."})
 *  - service:  objekat servisa, idealno sa fields:
 *      service.fields = [{ id, name/key, label, type/data_type, required, options }, ...]
 *
 * Napomena:
 * - Kod tebe se u backend-u/seed-u vidi da se koristi $field->key, a u front-u fields imaju {name}.
 *   Zato ovde mapiramo po: field.name || field.key.
 */
export default function FormDataPretty({
  formData,
  service,
  emptyText = "Nema unetih podataka.",
  maxHeight = 320,
}) {
  const normalized = useMemo(() => {
    if (!formData) return {};

    // Nekad form_data može stići kao string (JSON iz baze) -> parsiramo.
    if (typeof formData === "string") {
      try {
        const parsed = JSON.parse(formData);
        return parsed && typeof parsed === "object" ? parsed : {};
      } catch {
        return {};
      }
    }

    return typeof formData === "object" ? formData : {};
  }, [formData]);

  const fields = useMemo(() => {
    // podrži više shape-ova
    const f = service?.fields?.data ?? service?.fields ?? [];
    return Array.isArray(f) ? f : [];
  }, [service]);

  const rows = useMemo(() => {
    const obj = normalized || {};
    const keys = Object.keys(obj);

    // Ako imamo definisana polja servisa, redosled i label uzimamo odatle.
    if (fields.length) {
      const seen = new Set();

      const ordered = fields
        .map((f) => {
          const k = String(f?.name ?? f?.key ?? "");
          if (!k) return null;
          seen.add(k);
          return {
            key: k,
            label: f?.label ?? prettifyKey(k),
            required: !!f?.required,
            type: String(f?.type ?? f?.data_type ?? "").toLowerCase(),
            value: obj[k],
          };
        })
        .filter(Boolean);

      // Dodaj i sve ključeve koji postoje u form_data, a nisu u fields (fallback)
      const extras = keys
        .filter((k) => !seen.has(String(k)))
        .map((k) => ({
          key: String(k),
          label: prettifyKey(String(k)),
          required: false,
          type: "",
          value: obj[k],
        }));

      return [...ordered, ...extras];
    }

    // Ako nemamo fields, samo prikaži sve iz form_data.
    return keys.map((k) => ({
      key: String(k),
      label: prettifyKey(String(k)),
      required: false,
      type: "",
      value: obj[k],
    }));
  }, [normalized, fields]);

  if (!rows.length) {
    return (
      <Alert
        icon={<IconInfoCircle size={16} />}
        title="Info."
        color="blue"
        radius="xl"
      >
        {emptyText}
      </Alert>
    );
  }

  return (
    <ScrollArea h={maxHeight}>
      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th style={{ width: "45%" }}>
              <Text fw={800} c={NAVY}>
                Polje.
              </Text>
            </Table.Th>
            <Table.Th>
              <Text fw={800} c={NAVY}>
                Vrednost.
              </Text>
            </Table.Th>
          </Table.Tr>
        </Table.Thead>

        <Table.Tbody>
          {rows.map((r) => (
            <Table.Tr key={r.key}>
              <Table.Td>
                <Group gap="xs" wrap="nowrap">
                  <Text fw={700} c={NAVY}>
                    {r.label}.
                  </Text>
                  {r.required && (
                    <Badge size="xs" variant="light" color="red">
                      OBAVEZNO.
                    </Badge>
                  )}
                </Group>
                {r.key && r.label !== r.key && (
                  <Text size="xs" c="dimmed">
                    {r.key}.
                  </Text>
                )}
              </Table.Td>

              <Table.Td>
                <ValueCell value={r.value} type={r.type} />
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );
}

function ValueCell({ value, type }) {
  if (value === null || value === undefined || value === "") {
    return <Text c="dimmed">-</Text>;
  }

  // Ako backend nekad vrati objekat/array (npr. select multivalue), prikaži JSON.
  if (typeof value === "object") {
    return (
      <Text
        style={{
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
          fontSize: 12,
        }}
      >
        {JSON.stringify(value, null, 2)}
      </Text>
    );
  }

  // Boolean pretty
  if (type === "boolean" || type === "checkbox") {
    return (
      <Badge variant="light" color={value ? "green" : "gray"}>
        {String(value) === "true" || value === true ? "DA." : "NE."}
      </Badge>
    );
  }

  return (
    <Text style={{ wordBreak: "break-word" }}>
      {String(value)}
      {String(type || "").toLowerCase() === "date" ? "." : "."}
    </Text>
  );
}

function prettifyKey(k) {
  // delivery_method -> Delivery method
  const s = String(k)
    .replace(/[_\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!s) return "-";
  return s.charAt(0).toUpperCase() + s.slice(1);
}
