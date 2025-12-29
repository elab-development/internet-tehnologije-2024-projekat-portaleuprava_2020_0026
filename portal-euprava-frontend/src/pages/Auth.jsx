// src/pages/Auth.jsx
import React, { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DatePicker } from "@mantine/dates";
import "@mantine/dates/styles.css";
import { Popover } from "@mantine/core";
import dayjs from "dayjs";
import {
  Anchor,
  Button,
  Divider,
  Group,
  Paper,
  PasswordInput,
  Stack,
  Tabs,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconLock, IconMail, IconUser, IconId, IconCalendar, IconCheck } from "@tabler/icons-react";

import api from "../api/api";
import { saveAuth } from "../utils/auth";

// Minimalno “očisti” email da ne šalje razmake / nevidljive znakove.
const cleanEmail = (v) =>
  String(v || "")
    .trim()
    .replace(/^mailto:/i, "")
    .replace(/[\s\u00A0\u200B-\u200D\uFEFF]+/g, "") // whitespace + NBSP + zero-width
    .replace(/[.,;:]+$/g, "") // ako se zalepi tačka na kraj
    .toLowerCase();

export default function Auth() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const mode = useMemo(() => params.get("mode") || "login", [params]);
  const [activeTab, setActiveTab] = useState(mode);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regDob, setRegDob] = useState(null);
  const [dobOpened, setDobOpened] = useState(false);
  const [regJmbg, setRegJmbg] = useState("");
  const [regLoading, setRegLoading] = useState(false);

  const setTab = (tab) => {
    setActiveTab(tab);
    setParams({ mode: tab });
  };

  const goHomeByRole = (role) => {
    if (role === "ADMIN") navigate("/home-admin", { replace: true });
    else if (role === "OFFICER") navigate("/home-officer", { replace: true });
    else navigate("/home-citizen", { replace: true });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegLoading(true);

    try {
      if (!regDob) {
        notifications.show({
          title: "Greška.",
          message: "Molim vas izaberite datum rođenja.",
          color: "red",
        });
        return;
      }

      const payload = {
        name: String(regName || "").trim(),
        email: cleanEmail(regEmail),
        password: regPassword,
        date_of_birth: dayjs(regDob).format("YYYY-MM-DD"),
        jmbg: regJmbg,
      };

      await api.post("/auth/register", payload, {
        headers: { "Content-Type": "application/json" },
      });

      notifications.show({
        title: "Registracija uspešna.",
        message: "Sada se prijavite sa vašim email-om i lozinkom.",
        icon: <IconCheck size={18} />,
        color: "blue",
      });

      setTab("login");
      setLoginEmail(payload.email);
      setLoginPassword("");
      setRegPassword("");
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (err?.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(" ")
          : "Registracija nije uspela.");

      notifications.show({
        title: "Greška.",
        message: msg,
        color: "red",
      });
    } finally {
      setRegLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);

    try {
      const payload = {
        email: cleanEmail(loginEmail),
        password: loginPassword,
      };

      const res = await api.post("/auth/login", payload, {
        headers: { "Content-Type": "application/json" },
      });

      const token = res?.data?.token;
      const user = res?.data?.user;

      if (!token || !user) {
        throw new Error("Nedostaje token ili user u odgovoru.");
      }

      saveAuth({ token, user });

      notifications.show({
        title: "Prijava uspešna.",
        message: `Dobrodošli, ${user.name}.`,
        icon: <IconCheck size={18} />,
        color: "blue",
      });

      goHomeByRole(user.role);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (err?.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(" ")
          : "Neuspešna prijava. Proverite email i lozinku.");

      notifications.show({
        title: "Greška.",
        message: msg,
        color: "red",
      });
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div className="auth-left">
          <div className="brand-row">
            <img className="brand-logo" src="/images/logo.png" alt="Portal eUprava logo" />
            <br />
            <div>
              <div className="brand-subtitle">Vaša veza sa državnom upravom, online svakog dana.</div>
            </div>
          </div>

          <div className="feature-list">
            <Text>
              <IconCheck size={16} style={{ marginRight: 8 }} />
              Podnesite zahteve online.
            </Text>
            <Text>
              <IconCheck size={16} style={{ marginRight: 8 }} />
              Pratite status zahteva u realnom vremenu.
            </Text>
            <Text>
              <IconCheck size={16} style={{ marginRight: 8 }} />
              Jednostavan pristup servisima i institucijama.
            </Text>
            <Text>
              <IconCheck size={16} style={{ marginRight: 8 }} />
              Moderan i pregledan interfejs.
            </Text>
          </div>

          <Divider my="lg" />

          <Text c="dimmed">Savet. Posle registracije odmah se prijavite na nalog.</Text>
        </div>

        <Paper className="auth-right" shadow="sm">
          <Title order={2} c="#0B1F3B">
            Prijava i registracija.
          </Title>

          <Text c="dimmed" mt={6}>
            Prijavite se da biste pristupili servisima, ili kreirajte nalog.
          </Text>

          <Tabs value={activeTab} onChange={setTab} mt="lg" radius="xl">
            <Tabs.List grow>
              <Tabs.Tab value="login" leftSection={<IconLock size={16} />}>
                Prijava.
              </Tabs.Tab>
              <Tabs.Tab value="register" leftSection={<IconUser size={16} />}>
                Registracija.
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="login" pt="lg">
              <form onSubmit={handleLogin}>
                <Stack>
                  <TextInput
                    label="Email."
                    placeholder="ime.prezime@mail.com."
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    onBlur={() => setLoginEmail(cleanEmail(loginEmail))}
                    leftSection={<IconMail size={16} />}
                    required
                  />

                  <PasswordInput
                    label="Lozinka."
                    placeholder="Unesite lozinku."
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    leftSection={<IconLock size={16} />}
                    required
                  />

                  <Button type="submit" loading={loginLoading} fullWidth>
                    Prijavi se.
                  </Button>

                  <Group justify="center" gap="xs">
                    <Text size="sm" c="dimmed">
                      Nemate nalog.
                    </Text>
                    <Anchor size="sm" onClick={() => setTab("register")}>
                      Registrujte se.
                    </Anchor>
                  </Group>
                </Stack>
              </form>
            </Tabs.Panel>

            <Tabs.Panel value="register" pt="lg">
              <form onSubmit={handleRegister}>
                <Stack>
                  <TextInput
                    label="Ime i prezime."
                    placeholder="Marko Marković."
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    leftSection={<IconUser size={16} />}
                    required
                  />

                  <TextInput
                    label="Email."
                    placeholder="ime.prezime@mail.com."
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    onBlur={() => setRegEmail(cleanEmail(regEmail))}
                    leftSection={<IconMail size={16} />}
                    required
                  />

                  <PasswordInput
                    label="Lozinka."
                    placeholder="Minimum 6 karaktera."
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    leftSection={<IconLock size={16} />}
                    required
                  />

                  <Popover
                    opened={dobOpened}
                    onChange={setDobOpened}
                    position="bottom-start"
                    withArrow
                    shadow="md"
                    withinPortal
                    zIndex={3000}
                  >
                    <Popover.Target>
                      <TextInput
                        label="Datum rođenja."
                        placeholder="Izaberite datum."
                        value={regDob ? dayjs(regDob).format("YYYY-MM-DD") : ""}
                        onFocus={() => setDobOpened(true)}
                        onClick={() => setDobOpened(true)}
                        readOnly
                        leftSection={<IconCalendar size={16} />}
                        required
                      />
                    </Popover.Target>

                    <Popover.Dropdown>
                      <DatePicker
                        value={regDob}
                        onChange={(d) => {
                          setRegDob(d);
                          setDobOpened(false);
                        }}
                        maxDate={new Date()}
                      />
                    </Popover.Dropdown>
                  </Popover>

                  <TextInput
                    label="JMBG."
                    placeholder="13 cifara."
                    value={regJmbg}
                    onChange={(e) => setRegJmbg(e.target.value.replace(/\D/g, "").slice(0, 13))}
                    leftSection={<IconId size={16} />}
                    required
                  />

                  <Button type="submit" loading={regLoading} fullWidth>
                    Registruj se.
                  </Button>

                  <Group justify="center" gap="xs">
                    <Text size="sm" c="dimmed">
                      Već imate nalog.
                    </Text>
                    <Anchor size="sm" onClick={() => setTab("login")}>
                      Prijavite se.
                    </Anchor>
                  </Group>
                </Stack>
              </form>
            </Tabs.Panel>
          </Tabs>
        </Paper>
      </div>
    </div>
  );
}
