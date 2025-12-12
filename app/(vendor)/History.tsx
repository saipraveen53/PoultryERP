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
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { rootApi } from "../(utils)/axiosInstance";

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


const MY_ORDERS_PATH = "http://192.168.0.110:8081/api/orders/vendor/my-orders";

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

  const Cock = () => <Text style={{ marginRight: 8 }}>🐓</Text>;
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
function decodeJwt(token?: string | null) {
  if (!token) return null;
  try {
    // handle case where AsyncStorage stores a JSON object { token: "..." }
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
      // Node / some RN environments
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Buffer = require("buffer").Buffer;
      payloadJson = Buffer.from(base64, "base64").toString("utf8");
    }
    return JSON.parse(payloadJson);
  } catch (e) {
    console.warn("decodeJwt failed", e);
    return null;
  }
}
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

      // fallback to route param or default
      const p = String(phoneParam ?? defaultPhone);
      await fetchOrders(p);
    } catch (e) {
      console.error("Initial fetch error", e);
      await fetchOrders(String(phoneParam ?? defaultPhone));
    }
  })();

  return () => ac.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // Optionally group or sort; for now sort by orderDate descending
    return [...orders].sort((a, b) => (b.orderDate > a.orderDate ? 1 : -1));
  }, [orders]);

  return (
    <SafeAreaView className="flex-1 bg-slate-50 mt-6">
      <StatusBar barStyle="light-content" backgroundColor="#ea580c" />

      {/* Header */}
      <View className="bg-orange-600 px-4 pt-6 pb-4">
        <View className="flex-row justify-between items-start">
          <View>
            <Text className="text-orange-100 text-xs uppercase tracking-widest">Vendor</Text>
            <Text className="text-white text-2xl font-bold">My Orders</Text>
            <Text className="text-orange-100 text-sm mt-1">View past and pending orders</Text>
          </View>

          <View className="flex-row items-center space-x-3">
            <TouchableOpacity onPress={() => router.back()} className="flex-row items-center bg-orange-700 px-3 py-2 rounded-full">
              <Cock />
              <Feather name="arrow-left" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16, paddingTop: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
      >
        {/* Controls: phone input + actions */}
        <View className={`bg-white p-4 rounded-2xl border border-slate-100 ${isWide ? "max-w-5xl mx-auto" : ""}`}>
          <Text className="text-sm text-slate-700 mb-2">Phone to load orders</Text>

          <View className="flex-row gap-3 items-center">
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="Vendor phone number"
              keyboardType="phone-pad"
              className="flex-1 p-3 rounded-xl bg-slate-50 border border-slate-200"
            />

            <TouchableOpacity
              onPress={() => fetchOrders(phone)}
              className="px-4 py-3 bg-orange-600 rounded-xl"
            >
              <Text className="text-white font-semibold">Load</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setPhone("9876543210");
                fetchOrders("9876543210");
              }}
              className="px-3 py-3 bg-slate-100 rounded-xl"
            >
              <Text className="text-slate-700">Refresh</Text>
            </TouchableOpacity>
          </View>

          {error ? <Text className="text-red-500 text-sm mt-3">{error}</Text> : null}
        </View>

        {/* Orders list */}
        {loading ? (
          <View className="h-60 items-center justify-center">
            <AnimatedHen />
            {/*<ActivityIndicator size="large" color="#ea580c" style={{ marginTop: 6 }} />*/}
            <Text className="text-slate-500 mt-3">Loading batches...</Text>
          </View>
        ) : grouped.length === 0 ? (
          <View className="items-center py-16 bg-white rounded-2xl border border-slate-100">
            <AnimatedHen />
            <Text className="text-slate-500">No orders found for this phone.</Text>
          </View>
        ) : (
          <View className={`${isWide ? "max-w-5xl mx-auto" : ""} flex-col gap-4`}>
            {grouped.map((o) => {
              const date = o.deliveryDate ?? o.orderDate?.split("T")?.[0] ?? "";
              return (
                <View key={String(o.id)} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                  <View className="flex-row justify-between items-start">
                    <View style={{ flex: 1 }}>
                      <Text className="text-xs text-slate-400">Order • <Text className="font-bold text-slate-800">{o.orderCode}</Text></Text>
                      <Text className="text-lg font-bold text-slate-900 mt-1">{o.vendorName}</Text>
                      <Text className="text-sm text-slate-500 mt-1">{o.shopName}</Text>
                      <Text className="text-xs text-slate-400 mt-2">{o.address}</Text>

                      <View className="flex-row gap-3 mt-3">
                        <View>
                          <Text className="text-xs text-slate-500">Delivery</Text>
                          <Text className="font-semibold text-slate-800">{date}</Text>
                        </View>

                        <View>
                          <Text className="text-xs text-slate-500">Quantity</Text>
                          <Text className="font-semibold text-slate-800">{o.quantity}</Text>
                        </View>

                        <View>
                          <Text className="text-xs text-slate-500">Weight (kg)</Text>
                          <Text className="font-semibold text-slate-800">{o.weight}</Text>
                        </View>

                        <View>
                          <Text className="text-xs text-slate-500">Batch</Text>
                          <Text className="font-semibold text-orange-600">{o.batchCode}</Text>
                        </View>
                      </View>
                      <View className="flex-row gap-3 mt-2">
                        <View>
                          <Text className="text-xs text-slate-500">Breed</Text>
                          <Text className="font-semibold text-slate-800">{o.breed}</Text>
                        </View>
                        <View>
                          <Text className="text-xs text-slate-500">Vehicle</Text>
                          <Text className="font-semibold text-slate-800">{o.vehicleNumber ?? "N/A"}</Text>
                        </View>
                        <View>
                          <Text className="text-xs text-slate-500">Driver</Text>
                          <Text className="font-semibold text-slate-800">{o.driverName ?? "N/A"}</Text>     
                       </View>
                        <View>
                          <Text className="text-xs text-slate-500">Driver Phone</Text>
                          <Text className="font-semibold text-slate-800">{o.driverPhone ?? "N/A"}</Text>
                        </View>
                      </View>
                      <View className="flex-row gap-3 mt-2">
                        {(o.receivedQuantity != null || o.receivedWeight != null || o.pricePerKg != null || o.totalPrice != null) && (
                        <View className="mt-1 border-t border-slate-100 pt-3 flex-row flex-wrap gap-4">
                          {o.receivedQuantity != null && (
                            <View>
                              <Text className="text-xs text-slate-500">Received Qty</Text>
                              <Text className="font-semibold text-slate-800">{o.receivedQuantity}</Text>
                            </View>
                          )}
                      
                          {o.receivedWeight != null && (
                            <View>
                              <Text className="text-xs text-slate-500">Received Wt (kg)</Text>
                              <Text className="font-semibold text-slate-800">{o.receivedWeight}</Text>
                            </View>
                          )}
                      
                          {o.pricePerKg != null && (
                            <View>
                              <Text className="text-xs text-slate-500">Price / kg</Text>
                              <Text className="font-semibold text-slate-800">₹{Number(o.pricePerKg).toFixed(2)}</Text>
                            </View>
                          )}
                      
                          {o.totalPrice != null && (
                            <View>
                              <Text className="text-xs text-slate-500">Total</Text>
                              <Text className="font-semibold text-orange-600">₹{Number(o.totalPrice).toFixed(2)}</Text>
                            </View>
                          )}
                        </View>
                      )}
                      </View>
                    </View>

                    <View className="items-end ml-4">
                      <Text
                        className={`text-sm font-semibold ${
                          o.status === "PENDING"
                            ? "text-yellow-600"
                            : o.status === "DELIVERED"
                            ? "text-green-600"
                            : o.status === "DISPATCHED"
                            ? "text-blue-600"
                            : "text-slate-600"
                        }`}
                      >
                        {o.status}
                      </Text>
                      <Text className="text-xs text-slate-400 mt-2">{new Date(o.orderDate).toLocaleString()}</Text>
                    </View>
                  </View>

                  <View className="flex-row justify-end gap-3 mt-4">
                    <TouchableOpacity
                      onPress={() => {
                        // Open a simple detail / external action - we keep it simple
                        Alert.alert("View Details", `Order ${o.orderCode}\n${o.vendorName}\n${o.phoneNumber}`);
                      }}
                      className="px-3 py-2 bg-slate-100 rounded-xl"
                    >
                      <Text className="text-slate-700 font-semibold">Details</Text>
                    </TouchableOpacity>

                    <Link
                      href={`/Report?vendorName=${encodeURIComponent(String(o.vendorName ?? ""))}&phone=${encodeURIComponent(
                        String(o.phoneNumber ?? "")
                      )}`}
                      asChild
                    >
                      <TouchableOpacity  className="flex-row items-center bg-orange-600 px-3 py-2 rounded-full">
                        <Cock />
                        <Text className="text-white font-semibold">Report</Text>
                      </TouchableOpacity>
                    </Link>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}