// app/(vendor)/History.tsx
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import React, { JSX, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { rootApi } from "../(utils)/axiosInstance";

// --- TYPES ---
type Order = {
  id: number | string;
  orderCode: string;
  vendorName: string;
  phoneNumber: string;
  shopName: string | null;
  deliveryDate: string | null;
  quantity: number;
  weight: number;
  orderDate: string;
  status: string;
  vehicleNumber?: string | null;
  driverName?: string | null;
  driverPhone?: string | null;
  address?: string | null;
  actualDeliveryTime?: string | null;
  batchId?: number | string;
  batchCode?: string;
  breed?: string;
  receivedWeight?: number | null;
  receivedQuantity?: number | null;
  pricePerKg?: number | null;
  totalPrice?: number | null;
};

const MY_ORDERS_PATH = "http://192.168.0.110:8081/api/farm/orders/vendor/my-orders";

// --- HELPER: JWT DECODE ---
function decodeJwt(token?: string | null) {
  if (!token) return null;
  try {
    const raw = token.includes(".") ? token : (() => {
      try {
        const p = JSON.parse(token);
        return p?.token ?? p?.accessToken ?? token;
      } catch {
        return token;
      }
    })();

    const [, payloadB64] = raw.split(".");
    if (!payloadB64) return null;
    const base64 = payloadB64.replace(/-/g, "+").replace(/_/g, "/") + "==".slice((2 - (payloadB64.length % 4)) % 2);
    let payloadJson = "";
    if (typeof globalThis.atob === "function") {
      payloadJson = globalThis.atob(base64);
    } else {
      const Buffer = require("buffer").Buffer;
      payloadJson = Buffer.from(base64, "base64").toString("utf8");
    }
    return JSON.parse(payloadJson);
  } catch (e) {
    console.warn("decodeJwt failed", e);
    return null;
  }
}

export default function History(): JSX.Element {
  const { width } = Dimensions.get("window");
  const isWide = width > 768;
  const { phone: phoneParam } = useLocalSearchParams() as { phone?: string };
  const router = useRouter();

  const defaultPhone = String(phoneParam ?? "9876543210");

  const [phone, setPhone] = useState<string>(defaultPhone);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // --- ANIMATED HEN COMPONENT ---
  const AnimatedHen = () => {
    const scale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.15, duration: 450, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 0.95, duration: 450, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }, [scale]);

    return (
      <Animated.Text
        accessibilityLabel="Loading hen"
        style={{ transform: [{ scale }], fontSize: 58, marginBottom: 6 }}
      >
        🐔
      </Animated.Text>
    );
  };

  const Cock = () => <Text style={{ marginRight: 8 }}>🐓</Text>;

  // --- FETCH LOGIC ---
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const raw =
          (await AsyncStorage.getItem("userToken")) ??
          (await AsyncStorage.getItem("UserToken")) ??
          null;

        if (raw) {
          const payload = decodeJwt(raw);
          const phoneFromToken =
            payload?.phone ||
            payload?.phoneNumber ||
            payload?.mobile ||
            payload?.username ||
            payload?.sub ||
            null;

          if (phoneFromToken && String(phoneFromToken).trim().length >= 3) {
            setPhone(String(phoneFromToken));
            await fetchOrders(String(phoneFromToken));
            return;
          }
        }

        const p = String(phoneParam ?? defaultPhone);
        await fetchOrders(p);
      } catch (e) {
        console.error("Initial fetch error", e);
        await fetchOrders(String(phoneParam ?? defaultPhone));
      }
    })();

    return () => ac.abort();
  }, []);

  async function fetchOrders(forPhone?: string) {
    const p = forPhone ?? phone;
    if (!p || p.trim().length < 3) {
      setError("Enter a valid phone number.");
      setOrders([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await rootApi.get(`${MY_ORDERS_PATH}/${encodeURIComponent(p)}`);
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (e: any) {
      console.error("Fetch orders error", e);
      const status = e?.response?.status;
      if (status === 401) {
        Alert.alert("Unauthorized", "Session expired. Please login again.");
        router.replace("/");
        return;
      }
      if (status === 403) {
        Alert.alert("Forbidden", "Access denied. Check permissions.");
        return;
      }
      setError("Failed to load orders. Check server or network.");
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function onRefresh() {
    setRefreshing(true);
    fetchOrders(phone);
  }

  const grouped = useMemo(() => {
    return [...orders].sort((a, b) => (b.orderDate > a.orderDate ? 1 : -1));
  }, [orders]);

  // --- RENDER ---
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#ea580c" />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerSub}>Vendor Portal</Text>
            <Text style={styles.headerTitle}>My Orders</Text>
          </View>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
          >
            <Cock />
            <Feather name="arrow-left" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ea580c" />}
      >
        {/* CONTROLS CARD */}
        <View style={[styles.filterCard, isWide && styles.wideCard]}>
          <Text style={styles.label}>Phone to load orders</Text>
          <View style={styles.inputRow}>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="Vendor phone number"
              keyboardType="phone-pad"
              style={styles.input}
              placeholderTextColor="#94a3b8"
            />
            <TouchableOpacity onPress={() => fetchOrders(phone)} style={styles.loadBtn}>
              <Text style={styles.btnText}>Load</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => {
                setPhone("9876543210");
                fetchOrders("9876543210");
              }} 
              style={styles.refreshBtn}
            >
              <Feather name="refresh-cw" size={18} color="#475569" />
            </TouchableOpacity>
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        {/* ORDERS LIST */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <AnimatedHen />
            <Text style={styles.loadingText}>Loading orders...</Text>
          </View>
        ) : grouped.length === 0 ? (
          <View style={styles.emptyContainer}>
            <AnimatedHen />
            <Text style={styles.emptyText}>No orders found for this phone.</Text>
          </View>
        ) : (
          <View style={isWide ? styles.wideList : styles.list}>
            {grouped.map((o) => {
              const date = o.deliveryDate ?? o.orderDate?.split("T")?.[0] ?? "";
              
              // Status Logic
              const isPending = o.status === "PENDING";
              const isDelivered = o.status === "DELIVERED";
              const isDispatched = o.status === "DISPATCHED";
              
              let statusStyle = styles.statusPending;
              let statusText = styles.textPending;
              
              if(isDelivered) { statusStyle = styles.statusDelivered; statusText = styles.textDelivered; }
              else if(isDispatched) { statusStyle = styles.statusDispatched; statusText = styles.textDispatched; }
              else if(o.status === "REJECTED") { statusStyle = styles.statusRejected; statusText = styles.textRejected; }

              return (
                <View key={String(o.id)} style={styles.card}>
                  
                  {/* Card Header */}
                  <View style={styles.cardHeader}>
                    <View style={{flex: 1}}>
                      <Text style={styles.orderId}>Order • <Text style={styles.orderIdBold}>{o.orderCode}</Text></Text>
                      <Text style={styles.vendorName}>{o.vendorName}</Text>
                      {o.shopName ? <Text style={styles.shopName}>{o.shopName}</Text> : null}
                      {o.address ? <Text style={styles.address}>📍 {o.address}</Text> : null}
                    </View>
                    <View style={{alignItems: 'flex-end'}}>
                        <View style={[styles.statusBadge, statusStyle]}>
                            <Text style={[styles.statusText, statusText]}>{o.status}</Text>
                        </View>
                        <Text style={styles.orderDate}>{new Date(o.orderDate).toLocaleDateString()}</Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  {/* Order Details Grid */}
                  <View style={styles.detailsGrid}>
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Delivery</Text>
                        <Text style={styles.detailValue}>{date}</Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Quantity</Text>
                        <Text style={styles.detailValue}>{o.quantity}</Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Weight (kg)</Text>
                        <Text style={styles.detailValue}>{o.weight}</Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Batch</Text>
                        <Text style={[styles.detailValue, {color: '#ea580c'}]}>{o.batchCode}</Text>
                    </View>
                  </View>

                  {/* Vehicle Info */}
                  {(o.vehicleNumber || o.driverName) && (
                      <View style={styles.vehicleInfoBox}>
                          <Text style={styles.sectionHeader}>🚚 Transport Info</Text>
                          <View style={styles.row}>
                              <Text style={styles.infoText}>Veh: {o.vehicleNumber ?? "N/A"}</Text>
                              <Text style={styles.infoText}> | Driver: {o.driverName ?? "N/A"}</Text>
                          </View>
                          {o.driverPhone && <Text style={styles.infoText}>📞 {o.driverPhone}</Text>}
                      </View>
                  )}

                  {/* Received / Bill Info */}
                  {(o.receivedQuantity != null || o.receivedWeight != null || o.pricePerKg != null || o.totalPrice != null) && (
                    <View style={styles.billBox}>
                      <Text style={styles.sectionHeader}>🧾 Final Bill & Receipt</Text>
                      <View style={styles.billGrid}>
                        {o.receivedQuantity != null && (
                            <View style={styles.billItem}>
                                <Text style={styles.billLabel}>Rcvd Qty</Text>
                                <Text style={styles.billValue}>{o.receivedQuantity}</Text>
                            </View>
                        )}
                        {o.receivedWeight != null && (
                            <View style={styles.billItem}>
                                <Text style={styles.billLabel}>Rcvd Wt</Text>
                                <Text style={styles.billValue}>{o.receivedWeight} kg</Text>
                            </View>
                        )}
                        {o.pricePerKg != null && (
                            <View style={styles.billItem}>
                                <Text style={styles.billLabel}>Price/Kg</Text>
                                <Text style={styles.billValue}>₹{Number(o.pricePerKg).toFixed(2)}</Text>
                            </View>
                        )}
                        {o.totalPrice != null && (
                            <View style={styles.billItem}>
                                <Text style={styles.billLabel}>Total</Text>
                                <Text style={[styles.billValue, {color: '#ea580c', fontSize: 16}]}>₹{Number(o.totalPrice).toFixed(2)}</Text>
                            </View>
                        )}
                      </View>
                    </View>
                  )}

                  {/* Actions */}
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      onPress={() => Alert.alert("Order Details", `Order: ${o.orderCode}\nVendor: ${o.vendorName}\nPhone: ${o.phoneNumber}`)}
                      style={styles.detailsBtn}
                    >
                      <Text style={styles.detailsBtnText}>Details</Text>
                    </TouchableOpacity>

                    <Link
                      href={`/Report?vendorName=${encodeURIComponent(String(o.vendorName ?? ""))}&phone=${encodeURIComponent(String(o.phoneNumber ?? ""))}`}
                      asChild
                    >
                      <TouchableOpacity style={styles.reportBtn}>
                        <Cock />
                        <Text style={styles.reportBtnText}>Report</Text>
                      </TouchableOpacity>
                    </Link>
                  </View>

                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  
  // Header
  header: { 
    backgroundColor: '#ea580c', 
    paddingTop: 50, 
    paddingBottom: 25, 
    paddingHorizontal: 20, 
    borderBottomLeftRadius: 30, 
    borderBottomRightRadius: 30, 
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 
  },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerSub: { color: '#ffedd5', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  headerTitle: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginTop: 2 },
  backButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#c2410c', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },

  scrollContent: { padding: 16, paddingBottom: 40 },
  
  // Controls Card
  filterCard: { backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  wideCard: { maxWidth: 800, alignSelf: 'center', width: '100%' },
  label: { fontSize: 13, color: '#64748b', marginBottom: 8, fontWeight: '600' },
  inputRow: { flexDirection: 'row', gap: 10 },
  input: { flex: 1, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, padding: 12, fontSize: 15, color: '#0f172a' },
  loadBtn: { backgroundColor: '#ea580c', paddingHorizontal: 20, justifyContent: 'center', borderRadius: 10 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  refreshBtn: { backgroundColor: '#f1f5f9', paddingHorizontal: 16, justifyContent: 'center', borderRadius: 10 },
  errorText: { color: '#ef4444', marginTop: 8, fontSize: 13 },

  // List
  list: { flexDirection: 'column', gap: 16 },
  wideList: { maxWidth: 800, alignSelf: 'center', width: '100%', gap: 16 },
  
  // Card
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderId: { fontSize: 12, color: '#94a3b8' },
  orderIdBold: { fontWeight: 'bold', color: '#334155' },
  vendorName: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginTop: 4 },
  shopName: { fontSize: 14, color: '#64748b', marginTop: 2 },
  address: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  orderDate: { fontSize: 11, color: '#94a3b8', marginTop: 6 },

  // Status Badges
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusPending: { backgroundColor: '#fef3c7' },
  statusDelivered: { backgroundColor: '#dcfce7' },
  statusDispatched: { backgroundColor: '#dbeafe' },
  statusRejected: { backgroundColor: '#fee2e2' },
  
  statusText: { fontSize: 11, fontWeight: 'bold' },
  textPending: { color: '#d97706' },
  textDelivered: { color: '#16a34a' },
  textDispatched: { color: '#2563eb' },
  textRejected: { color: '#dc2626' },

  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 12 },

  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  detailItem: { minWidth: '22%' },
  detailLabel: { fontSize: 11, color: '#64748b', marginBottom: 2 },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#1e293b' },

  // Info Boxes
  vehicleInfoBox: { marginTop: 12, backgroundColor: '#f8fafc', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  billBox: { marginTop: 12, backgroundColor: '#fff7ed', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#fed7aa' },
  sectionHeader: { fontSize: 12, fontWeight: 'bold', color: '#475569', marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center' },
  infoText: { fontSize: 12, color: '#334155' },

  billGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  billItem: { alignItems: 'flex-start' },
  billLabel: { fontSize: 10, color: '#9a3412', marginBottom: 2, fontWeight: '600' },
  billValue: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },

  // Actions
  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 16 },
  detailsBtn: { paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#f1f5f9', borderRadius: 20 },
  detailsBtnText: { color: '#475569', fontWeight: '600', fontSize: 13 },
  reportBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#ea580c', borderRadius: 20 },
  reportBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },

  // Loading / Empty
  loadingContainer: { alignItems: 'center', justifyContent: 'center', height: 200 },
  loadingText: { color: '#94a3b8', marginTop: 10 },
  emptyContainer: { alignItems: 'center', padding: 40, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  emptyText: { color: '#94a3b8', marginTop: 10 },
});