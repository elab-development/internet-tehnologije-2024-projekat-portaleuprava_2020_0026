import React, { useEffect, useMemo, useState } from "react";
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Container,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { IconLogout, IconRefresh } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { clearAuth, getAuth } from "../utils/auth";
import Slider from "../components/Slider";

const NAVY = "#0B1F3B";

export default function HomeAdmin() {
  const navigate = useNavigate();
  const auth = getAuth();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [institutions, setInstitutions] = useState([]);
  const [users, setUsers] = useState([]);

  const lastUsers = useMemo(() => users.slice(0, 6), [users]);
  const lastInstitutions = useMemo(() => institutions.slice(0, 6), [institutions]);

  const load = async () => {
    setLoading(true);
    try {
      const [s1, s2, s3] = await Promise.all([
        api.get("/stats"),
        api.get("/institutions"),
        api.get("/users"),
      ]);

      setStats(s1.data);

      // Ako koristiš Resource collection: data.data
      setInstitutions(Array.isArray(s2.data?.data) ? s2.data.data : (s2.data ?? []));
      setUsers(Array.isArray(s3.data?.data) ? s3.data.data : (s3.data ?? []));
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

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  return (
         <div style={{ display: "flex", minHeight: "100vh" }}>
    <Slider />
    <div style={{ flex: 1 }}>
    <div className="auth-page" style={{ padding: 0 }}>
      <Container size="lg" py={28} style={{ position: "relative", zIndex: 1 }}>
        <Paper
          p="xl"
          radius="xl"
          style={{
            border: "1px solid rgba(11,31,59,0.12)",
            background: "rgba(255,255,255,0.90)",
            backdropFilter: "blur(8px)",
          }}
        >
          <Group justify="space-between" align="flex-start">
            <Group gap="sm">
              <img src="/images/logo.png" alt="logo" style={{ width: 40, height: 40, objectFit: "contain" }} />
              <div>
                <Title order={2} c={NAVY}>Admin – sistemski pregled.</Title>
                <Text c="dimmed">Korisnik: {auth?.user?.name}.</Text>
              </div>
            </Group>

            <Group>
              <ActionIcon variant="light" color="blue" onClick={load}>
                <IconRefresh size={18} />
              </ActionIcon>
              <Button variant="light" color="blue" leftSection={<IconLogout size={16} />} onClick={logout}>
                Odjavi se.
              </Button>
            </Group>
          </Group>

          <Stack mt="lg" gap="lg">
            {loading ? (
              <Group justify="center" py={30}><Loader /></Group>
            ) : (
              <>
                <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
                  <Card withBorder radius="xl">
                    <Text c="dimmed" size="sm">Ukupno zahteva.</Text>
                    <Title order={2} c={NAVY}>{stats?.total_requests ?? 0}.</Title>
                  </Card>

                  <Card withBorder radius="xl">
                    <Text c="dimmed" size="sm">Institucije.</Text>
                    <Title order={2} c={NAVY}>{institutions.length}.</Title>
                  </Card>

                  <Card withBorder radius="xl">
                    <Text c="dimmed" size="sm">Korisnici.</Text>
                    <Title order={2} c={NAVY}>{users.length}.</Title>
                  </Card>

                  <Card withBorder radius="xl">
                    <Text c="dimmed" size="sm">Top servis (po zahtevima).</Text>
                    <Title order={4} c={NAVY} style={{ marginTop: 6 }}>
                      {stats?.top_services?.[0]?.service_name ? `${stats.top_services[0].service_name}.` : "—"}
                    </Title>
                    {stats?.top_services?.[0]?.total != null && (
                      <Badge mt="sm" variant="light" color="blue">
                        {stats.top_services[0].total} zahteva.
                      </Badge>
                    )}
                  </Card>
                </SimpleGrid>

                {/* INSTITUCIJE */}
                <Card withBorder radius="xl" p="lg">
                  <Group justify="space-between" mb="sm">
                    <Title order={4} c={NAVY}>Institucije.</Title>
                    <Button variant="subtle" color="blue" onClick={() => alert("Kasnije: Institutions CRUD page.")}>
                      Upravljaj.
                    </Button>
                  </Group>

                  <Table striped highlightOnHover withTableBorder>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>ID.</Table.Th>
                        <Table.Th>Naziv.</Table.Th>
                        <Table.Th>Grad.</Table.Th>
                        <Table.Th>Email.</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {lastInstitutions.map((i) => (
                        <Table.Tr key={i.id}>
                          <Table.Td>{i.id}.</Table.Td>
                          <Table.Td>{i.name}.</Table.Td>
                          <Table.Td>{i.city ?? "-"}</Table.Td>
                          <Table.Td>{i.email ?? "-"}</Table.Td>
                        </Table.Tr>
                      ))}
                      {lastInstitutions.length === 0 && (
                        <Table.Tr>
                          <Table.Td colSpan={4}>
                            <Text c="dimmed">Nema institucija.</Text>
                          </Table.Td>
                        </Table.Tr>
                      )}
                    </Table.Tbody>
                  </Table>
                </Card>

                {/* KORISNICI */}
                <Card withBorder radius="xl" p="lg">
                  <Group justify="space-between" mb="sm">
                    <Title order={4} c={NAVY}>Korisnici.</Title>
                    <Button variant="subtle" color="blue" onClick={() => alert("Kasnije: Users management page.")}>
                      Upravljaj.
                    </Button>
                  </Group>

                  <Table striped highlightOnHover withTableBorder>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>ID.</Table.Th>
                        <Table.Th>Ime.</Table.Th>
                        <Table.Th>Email.</Table.Th>
                        <Table.Th>Uloga.</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {lastUsers.map((u) => (
                        <Table.Tr key={u.id}>
                          <Table.Td>{u.id}.</Table.Td>
                          <Table.Td>{u.name}.</Table.Td>
                          <Table.Td>{u.email}.</Table.Td>
                          <Table.Td>
                            <Badge variant="light" color="blue">{u.role}.</Badge>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                      {lastUsers.length === 0 && (
                        <Table.Tr>
                          <Table.Td colSpan={4}>
                            <Text c="dimmed">Nema korisnika.</Text>
                          </Table.Td>
                        </Table.Tr>
                      )}
                    </Table.Tbody>
                  </Table>
                </Card>
              </>
            )}
          </Stack>
        </Paper>
      </Container>
    </div>

        </div>
  </div>
  );
}
