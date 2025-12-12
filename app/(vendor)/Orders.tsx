import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Link, useRouter } from "expo-router";
import React, { JSX, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { rootApi } from "../(utils)/axiosInstance";

type Batch = {
  id: number | string;
  totalHens: number;
  batchCode: string;
  breed: string;
  dateCreated: string;
  availableHens: number;
};

const BATCHES_ENDPOINT = "http://192.168.0.110:8081/api/orders/vendor/available-batches";
const PLACE_ORDER_ENDPOINT = "http://192.168.0.110:8081/api/orders/vendor/place-order";

export default function Orders(): JSX.Element {
  const router = useRouter();
  const { width } = Dimensions.get("window");
  const isWide = width > 768;

  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "sizeDesc" | "availableDesc">("recent");

  // selected batch -> show order form
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);

  async function fetchBatches(signal?: AbortSignal) {
  setLoading(true);
  setError(null);
  try {
    const res = await rootApi.get('http://192.168.0.110:8081/api/farm/orders/vendor/available-batches', { signal });
    setBatches(Array.isArray(res.data) ? res.data : []);
  } catch (e: any) {
    if (e.name === "AbortError") return;
    console.error("Fetch batches error", e);
    // show friendly message for 401/403
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
    setError("Failed to load batches. Check server or network.");
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
}

  useEffect(() => {
    const ac = new AbortController();
    fetchBatches(ac.signal);
    return () => ac.abort();
  }, []);

  function onRefresh() {
    setRefreshing(true);
    fetchBatches();
  }

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    let list = batches.filter((b) =>
      [String(b.batchCode), b.breed, String(b.id)].join(" ").toLowerCase().includes(s)
    );

    if (sortBy === "recent") {
      list = list.sort((a, b) => (b.dateCreated > a.dateCreated ? 1 : -1));
    } else if (sortBy === "sizeDesc") {
      list = list.sort((a, b) => b.totalHens - a.totalHens);
    } else {
      list = list.sort((a, b) => b.availableHens - a.availableHens);
    }
    return list;
  }, [batches, search, sortBy]);

  function openOrderForm(batch: Batch) {
    if (batch.availableHens <= 0) {
      Alert.alert("Unavailable", "This batch has no available hens to order.");
      return;
    }
    setSelectedBatch(batch);
  }

  const handleLogout = async () => {
    await AsyncStorage.clear();
    await AsyncStorage.removeItem("UserToken");
    router.replace("/");
  };

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
      style={{ transform: [{ scale }], fontSize: 56, marginBottom: 6 }}
    >
      🐔
    </Animated.Text>
  );
};
  const Cock = () => <Text style={{ marginRight: 8 }}>🐓</Text>;
  return (
    <View className="flex-1 bg-slate-50 mt-6">
      <StatusBar barStyle="light-content" backgroundColor="#ea580c" />

      {/* --- BACKGROUND THEME LAYER --- */}
      <View className="absolute top-0 left-0 right-0 h-[35%] bg-orange-600 rounded-b-[40px]" />

      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="px-4 pt-6 pb-6">
          <View className="flex-row justify-between items-center">
            <View>
              {/* Changed text to white to match theme */}
              <Text className="text-3xl font-bold text-white">Orders</Text>
              <Text className="text-orange-100 text-sm mt-1">Browse and order available batches</Text>
            </View>

            <View className="flex-row items-center space-x-3">
  {isWide ? (
    <Link href="/History" asChild>
      <TouchableOpacity className="flex-row items-center bg-white/20 px-3 py-2 rounded-full border border-white/30" accessibilityRole="button" accessibilityLabel="My Orders">
        <Cock />
        <Text className="text-white font-semibold ml-1">My Orders</Text>
      </TouchableOpacity>
    </Link>
  ) : (
    <Link href="/History" asChild>
      <TouchableOpacity className="p-2 bg-white/10 rounded-full" accessibilityRole="button" accessibilityLabel="My Orders">
        
        <Text className="text-white font-semibold ml-1">My Orders</Text>
      </TouchableOpacity>
    </Link>
  )}

  {/* logout */}
  {isWide ? (
    <TouchableOpacity onPress={handleLogout} className="flex-row items-center bg-white px-3 py-2 rounded-full" accessibilityRole="button" accessibilityLabel="Logout">
      <Cock />
      <Feather name="log-out" size={16} color="#ea580c" />
      <Text className="ml-2 text-slate-800 font-semibold">Logout</Text>
    </TouchableOpacity>
  ) : (
    <TouchableOpacity onPress={handleLogout} className="p-2 bg-white/10 rounded-full" accessibilityRole="button" accessibilityLabel="Logout">
      <Feather name="log-out" size={18} color="#fff" />
    </TouchableOpacity>
  )}
</View>
          </View>
        </View>

        {/* Batches list */}
        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 16, paddingTop: 10 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
        >
          {/* Search & Sort */}
          <View className="flex-row items-center gap-3">
            <View className="flex-1">
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search batch code, breed or id..."
                className="bg-white border border-slate-200 px-4 py-3 rounded-xl elevation-sm shadow-sm"
              />
            </View>

            <View className="w-40">
              <TouchableOpacity
                onPress={() =>
                  setSortBy(sortBy === "recent" ? "sizeDesc" : sortBy === "sizeDesc" ? "availableDesc" : "recent")
                }
                className="bg-white px-3 py-3 rounded-xl border border-slate-200 items-center shadow-sm"
              >
                <Text className="text-slate-700 font-semibold">
                  {sortBy === "recent" ? "Recent" : sortBy === "sizeDesc" ? "Size" : "Available"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {loading ? (
            <View className="h-60 items-center justify-center">
              <AnimatedHen />
              {/*<ActivityIndicator size="large" color="#ea580c" style={{ marginTop: 6 }} />*/}
              <Text className="text-slate-500 mt-3">Loading batches...</Text>
            </View>
          ) : error ? (
            <View className="bg-red-50 border border-red-100 p-4 rounded-xl">
              <Text className="text-red-600 font-semibold">Error</Text>
              <Text className="text-red-500 mt-1">{error}</Text>
              <TouchableOpacity onPress={() => fetchBatches()} className="mt-3 bg-red-600 px-4 py-2 rounded">
                <Text className="text-white">Retry</Text>
              </TouchableOpacity>
            </View>
          ) : filtered.length === 0 ? (
            <View className="items-center py-16 bg-white rounded-2xl border border-slate-100 mx-1">
              <AnimatedHen />
              <Text className="text-slate-500">No batches matched your search.</Text>
            </View>
          ) : (
            <View className={`${isWide ? "flex-row flex-wrap justify-start" : ""} gap-4`}>
              {filtered.map((batch) => {
                const remainingRatio = Math.max(0, Math.min(1, (batch.availableHens || 0) / (batch.totalHens || 1)));
                return (
                  <View
                    key={String(batch.id)}
                    style={{ width: isWide ? "32%" : "100%" }}
                    className="bg-white rounded-2xl p-4 mb-2 border border-slate-100 shadow-sm elevation-sm"
                  >
                    <View className="flex-row justify-between items-start">
                      <View>
                        <Text className="text-xs text-slate-400">
                          Batch - <Text className="text-xs font-bold text-slate-500">{batch.id}</Text>
                        </Text>
                        <Text className="text-lg font-bold text-slate-900">{batch.batchCode}</Text>
                        <Text className="text-sm text-slate-500 mt-1">{batch.breed}</Text>
                        <Text className="text-xs text-slate-400 mt-2">Created: {batch.dateCreated}</Text>
                      </View>

                      <View className="items-end">
                        <Text className="text-xs text-slate-500">Available</Text>
                        <Text className="text-xl font-bold text-orange-600">{batch.availableHens}</Text>
                        <Text className="text-xs text-slate-400">of {batch.totalHens}</Text>
                      </View>
                    </View>

                    {/* progress */}
                    <View className="mt-4">
                      <View className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <View style={{ width: `${remainingRatio * 100}%` }} className="h-2 bg-orange-500" />
                      </View>
                      <Text className="text-xs text-slate-400 mt-2">{Math.round(remainingRatio * 100)}% available</Text>
                    </View>

                    <View className="flex-row justify-between items-center mt-4">
                      <View>
                        <Text className="text-sm text-slate-600">Batch size</Text>
                        <Text className="font-semibold text-slate-900">{batch.totalHens} hens</Text>
                      </View>

                      <View className="flex-row items-center">
                        <TouchableOpacity
                          onPress={() => openOrderForm(batch)}
                          disabled={batch.availableHens <= 0}
                          className={`flex-row items-center px-4 py-2 rounded-xl ${batch.availableHens > 0 ? "bg-orange-600" : "bg-slate-200"}`}
                        >
                          <Cock />
                          <Text className={`${batch.availableHens > 0 ? "text-white" : "text-slate-400"} font-semibold`}>
                            {batch.availableHens > 0 ? "Order" : "Sold Out"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* Order Form Modal / Drawer */}
        {selectedBatch && (
          <OrderForm
            batch={selectedBatch}
            onClose={() => setSelectedBatch(null)}
            onPlaced={() => {
              setSelectedBatch(null);
              fetchBatches();
            }}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

/* ----------------------
   OrderForm component
   ---------------------- */
function OrderForm({
  batch,
  onClose,
  onPlaced,
}: {
  batch: Batch;
  onClose: () => void;
  onPlaced: () => void;
}): JSX.Element {
  const [orderBy, setOrderBy] = useState<"quantity" | "weight">("quantity");
  const [quantity, setQuantity] = useState<string>("50");
  const [weight, setWeight] = useState<string>("0");
  const [vendorName, setVendorName] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [shopName, setShopName] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [deliveryDate, setDeliveryDate] = useState<string>(""); // YYYY-MM-DD
  const [showNativeDatePicker, setShowNativeDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Format JS Date => yyyy-mm-dd
  function formatDateForInput(d: Date) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  // Native date change handler
  function onNativeDateChange(event: any, selected?: Date | undefined) {
    setShowNativeDatePicker(false);
    // on Android the event may be { type: "dismissed" } when dismissed
    if (event?.type === "dismissed") return;
    if (selected) {
      setDeliveryDate(formatDateForInput(selected));
      setErrors((s) => ({ ...s, deliveryDate: "" }));
    }
  }

  // Web date picker helper (creates an <input type="date"> and clicks it)
  function openWebDatePicker() {
    if (Platform.OS !== "web") return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const doc: any = typeof document !== "undefined" ? document : null;
      if (!doc) return;
      const input = doc.createElement("input");
      input.type = "date";
      input.style.position = "absolute";
      input.style.left = "-9999px";
      doc.body.appendChild(input);
      input.onchange = () => {
        if (input.value) setDeliveryDate(input.value);
        doc.body.removeChild(input);
      };
      input.click();
    } catch (e) {
      console.error("web date picker error", e);
    }
  }

  async function handleSubmit() {
    const err: Record<string, string> = {};
    if (!vendorName.trim()) err.vendorName = "Vendor name is required";
    if (!phoneNumber.trim()) err.phoneNumber = "Phone number is required";
    if (!shopName.trim()) err.shopName = "Shop name is required";
    if (!address.trim()) err.address = "Address is required";
    if (!deliveryDate.trim()) err.deliveryDate = "Delivery date is required";

    const q = Math.max(0, parseInt(quantity || "0", 10) || 0);
    const w = Math.max(0, parseFloat(weight || "0") || 0);

    if (orderBy === "quantity" && q <= 0) err.quantity = "Quantity must be > 0";
    if (orderBy === "weight" && w <= 0) err.weight = "Weight must be > 0";

    setErrors(err);
    if (Object.keys(err).length > 0) {
      Alert.alert("Missing information", "Please fill required fields before submitting.");
      return;
    }

    // Build payload (match provided format)
    const payload = {
      batchId: batch.id,
      batchCode: batch.batchCode,
      quantity: q,
      weight: w,
      vendorName,
      phoneNumber,
      shopName,
      address,
      deliveryDate,
    };

    setLoading(true);
    try {
  const res = await rootApi.post("http://192.168.0.110:8081/api/farm/orders/vendor/place-order", payload);
  if (res.status === 200 || res.status === 201) {
    Alert.alert("Success", "Your order has been placed.");
    onPlaced();
  } else {
    console.error("Place order failed", res.data);
    Alert.alert("Failed", "Your order is not placed.");
  }
} catch (e: any) {
  const status = e?.response?.status;
  const data = e?.response?.data;
  console.error("Place order error", status ?? e, data ?? "");
  if (status === 401) {
    Alert.alert("Unauthorized", "Session expired. Please login again.");
  } else if (status === 403) {
    Alert.alert("Forbidden", "Access denied. Check permissions.");
  } else {
    Alert.alert("Failed", "Your order is not placed.");
  }
} finally {
  setLoading(false);
}
  }
const Cock = () => <Text style={{ marginRight: 8 }}>🐓</Text>;
  return (
    <View className="absolute inset-0 z-50 items-end justify-end">
      {/* Backdrop */}
      <TouchableOpacity onPress={onClose} className="absolute inset-0 bg-black/60" />

      {/* Sheet */}
      <View style={{ width: "100%", maxHeight: "92%" }} className="bg-white rounded-t-3xl px-6 py-5 shadow-xl">
        <View className="flex-row justify-between items-center mb-3">
          <View>
            <Text className="text-lg font-bold text-slate-900">Create Order</Text>
            <Text className="text-sm text-slate-500">Batch {batch.batchCode} • ID {batch.id}</Text>
          </View>
          <TouchableOpacity onPress={onClose} className="bg-slate-100 p-2 rounded-full">
            <Feather name="x" size={18} color="#334155" />
          </TouchableOpacity>
        </View>

        {/* Two-column grid: Quantity | Weight */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 bg-slate-50 border border-slate-100 rounded-xl p-3">
            <Text className="text-xs text-slate-500 mb-2">Order by Quantity</Text>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-semibold text-slate-700">Quantity</Text>
             <TouchableOpacity onPress={() => setOrderBy("quantity")} className={`px-2 py-1 rounded-full ${orderBy === "quantity" ? "bg-orange-600" : "bg-slate-100"}`}>
                
                <Text className={`${orderBy === "quantity" ? "text-white" : "text-slate-700"} text-xs`}>Use qty</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              value={quantity}
              onChangeText={(t) => setQuantity(t.replace(/[^0-9]/g, ""))}
              keyboardType="numeric"
              className={`p-3 rounded-xl bg-white ${errors.quantity ? "border border-red-400" : "border border-slate-200"}`}
            />
            {errors.quantity ? <Text className="text-red-500 text-xs mt-1">{errors.quantity}</Text> : null}
          </View>

          <View className="flex-1 bg-slate-50 border border-slate-100 rounded-xl p-3">
            <Text className="text-xs text-slate-500 mb-2">Order by Weight</Text>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-semibold text-slate-700">Weight (kg)</Text>
              <TouchableOpacity onPress={() => setOrderBy("weight")} className={`px-2 py-1 rounded-full ${orderBy === "weight" ? "bg-orange-600" : "bg-slate-100"}`}>
                <Text className={`${orderBy === "weight" ? "text-white" : "text-slate-700"} text-xs`}>Use wt</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              value={weight}
              onChangeText={(t) => setWeight(t.replace(/[^0-9.]/g, ""))}
              keyboardType="decimal-pad"
              className={`p-3 rounded-xl bg-white ${errors.weight ? "border border-red-400" : "border border-slate-200"}`}
            />
            {errors.weight ? <Text className="text-red-500 text-xs mt-1">{errors.weight}</Text> : null}
          </View>
        </View>

        {/* Vendor + contact grid */}
        <View className="mb-4">
          <Text className="text-xs text-slate-800 mb-2">Vendor Information</Text>

          <Text className="text-xs text-slate-800 mb-1">Vendor name</Text>
          <TextInput
            value={vendorName}
            onChangeText={(t) => setVendorName(t)}
            placeholder="Vendor name"
            className={`p-3 rounded-xl bg-slate-50 mb-2 ${errors.vendorName ? "border border-red-400" : "border border-slate-200"}`}
          />
          {errors.vendorName ? <Text className="text-red-500 text-xs mb-2">{errors.vendorName}</Text> : null}

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="text-xs text-slate-800 mb-1">Phone number</Text>
              <TextInput
                value={phoneNumber}
                onChangeText={(t) => setPhoneNumber(t.replace(/[^0-9+]/g, ""))}
                placeholder="Phone number"
                keyboardType="phone-pad"
                className={`p-3 rounded-xl bg-slate-50 mb-2 ${errors.phoneNumber ? "border border-red-400" : "border border-slate-200"}`}
              />
              {errors.phoneNumber ? <Text className="text-red-500 text-xs mb-2">{errors.phoneNumber}</Text> : null}
            </View>

            <View className="flex-1">
              <Text className="text-xs text-slate-800 mb-1">Shop name</Text>
              <TextInput
                value={shopName}
                onChangeText={setShopName}
                placeholder="Shop name"
                className={`p-3 rounded-xl bg-slate-50 mb-2 ${errors.shopName ? "border border-red-400" : "border border-slate-200"}`}
              />
              {errors.shopName ? <Text className="text-red-500 text-xs mb-2">{errors.shopName}</Text> : null}
            </View>
          </View>

          <Text className="text-xs text-slate-800 mb-1">Delivery address</Text>
          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder="Delivery address"
            multiline
            numberOfLines={2}
            className={`p-3 rounded-xl bg-slate-50 mb-2 ${errors.address ? "border border-red-400" : "border border-slate-200"}`}
          />
          {errors.address ? <Text className="text-red-500 text-xs mb-2">{errors.address}</Text> : null}

          {/* Date Picker label + control */}
         <Text className="text-xs text-slate-800 mb-1">Delivery date</Text>

{Platform.OS === "web" ? (
  // Web: render a native date input so browser shows its date picker
  // Note: styling is simple — you can tweak to match design
  <input
    type="date"
    value={deliveryDate}
    onChange={(e: any) => {
      setDeliveryDate(e.target.value);
      setErrors((s) => ({ ...s, deliveryDate: "" }));
    }}
    style={{
      padding: 12,
      borderRadius: 12,
      border: errors.deliveryDate ? "1px solid #f87171" : "1px solid #e2e8f0",
      width: "100%",
      background: "#fff",
      color: deliveryDate ? "#0f172a" : "#94a3b8",
    }}
  />
) : (
  <View>
    <TouchableOpacity
      onPress={() => setShowNativeDatePicker(true)}
      className={`p-3 rounded-xl bg-white border ${errors.deliveryDate ? "border-red-400" : "border-slate-200"}`}
    >
      <Text className={`${deliveryDate ? "text-slate-800" : "text-slate-400"}`}>{deliveryDate || "Select date"}</Text>
    </TouchableOpacity>

    {showNativeDatePicker && (
      <DateTimePicker
        value={deliveryDate ? new Date(deliveryDate) : new Date()}
        mode="date"
        display={Platform.OS === "android" ? "default" : "spinner"}
        onChange={onNativeDateChange}
      />
    )}
  </View>
)}
{errors.deliveryDate ? <Text className="text-red-500 text-xs mt-2">{errors.deliveryDate}</Text> : null}
        </View>

        {/* Actions */}
        <View className="flex-row justify-end gap-3">
          <TouchableOpacity onPress={onClose} className="flex-row items-center px-4 py-3 bg-slate-100 rounded-xl">
            <Cock />
            <Text className="text-slate-700 font-semibold">Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSubmit} className="flex-row items-center px-4 py-3 bg-orange-600 rounded-xl">
            {loading ? <ActivityIndicator color="#fff" style={{ marginRight: 8 }} /> : null}
            <Cock />
            <Text className="text-white font-semibold">Place Order</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}