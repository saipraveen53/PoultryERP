// app/(vendor)/Orders.tsx
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
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { rootApi } from "../(utils)/axiosInstance";

// --- TYPES ---
type Batch = {
  id: number | string;
  totalHens: number;
  batchCode: string;
  breed: string;
  dateCreated: string;
  availableHens: number;
};

const BATCHES_ENDPOINT = "http://192.168.0.110:8081/api/farm/orders/vendor/available-batches";
const PLACE_ORDER_ENDPOINT = "http://192.168.0.110:8081/api/farm/orders/vendor/place-order";

export default function Orders(): JSX.Element {
  const router = useRouter();
  const { width } = Dimensions.get("window");
  const isWide = width > 768;

  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "sizeDesc" | "availableDesc">("recent");

  // Selected batch -> Show order form
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);

  // --- ANIMATED HEN ---
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

  // --- API CALLS ---
  async function fetchBatches(signal?: AbortSignal) {
    setLoading(true);
    setError(null);
    try {
      const res = await rootApi.get(BATCHES_ENDPOINT, { signal });
      setBatches(Array.isArray(res.data) ? res.data : []);
    } catch (e: any) {
      if (e.name === "AbortError") return;
      console.error("Fetch batches error", e);
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

  // --- FILTER & SORT ---
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#ea580c" />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Orders</Text>
            <Text style={styles.headerSub}>Browse and order available batches</Text>
          </View>

          <View style={styles.headerActions}>
            <Link href="/History" asChild>
              <TouchableOpacity style={styles.navButton}>
                <Cock />
                <Text style={styles.navButtonText}>My Orders</Text>
              </TouchableOpacity>
            </Link>

            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Feather name="log-out" size={18} color="#ea580c" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ea580c" />}
        >
          
          {/* SEARCH & SORT */}
          <View style={styles.searchRow}>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search batch code, breed..."
              style={styles.searchInput}
              placeholderTextColor="#94a3b8"
            />

            <TouchableOpacity
              onPress={() =>
                setSortBy(sortBy === "recent" ? "sizeDesc" : sortBy === "sizeDesc" ? "availableDesc" : "recent")
              }
              style={styles.sortButton}
            >
              <Feather name="filter" size={16} color="#475569" style={{ marginRight: 6 }} />
              <Text style={styles.sortButtonText}>
                {sortBy === "recent" ? "Recent" : sortBy === "sizeDesc" ? "Size" : "Available"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* CONTENT */}
          {loading ? (
            <View style={styles.centerContainer}>
              <AnimatedHen />
              <Text style={styles.loadingText}>Loading batches...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorTitle}>Error</Text>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={() => fetchBatches()} style={styles.retryBtn}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : filtered.length === 0 ? (
            <View style={styles.emptyBox}>
              <AnimatedHen />
              <Text style={styles.emptyText}>No batches found.</Text>
            </View>
          ) : (
            <View style={isWide ? styles.gridList : styles.list}>
              {filtered.map((batch) => {
                const remainingRatio = Math.max(0, Math.min(1, (batch.availableHens || 0) / (batch.totalHens || 1)));
                
                return (
                  <View key={String(batch.id)} style={[styles.card, isWide && styles.cardWide]}>
                    
                    {/* Card Top */}
                    <View style={styles.cardHeader}>
                      <View>
                        <Text style={styles.batchLabel}>Batch - <Text style={styles.batchId}>{batch.id}</Text></Text>
                        <Text style={styles.batchCode}>{batch.batchCode}</Text>
                        <Text style={styles.breedText}>{batch.breed}</Text>
                        <Text style={styles.dateText}>Created: {batch.dateCreated}</Text>
                      </View>

                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.availLabel}>Available</Text>
                        <Text style={styles.availCount}>{batch.availableHens}</Text>
                        <Text style={styles.totalText}>of {batch.totalHens}</Text>
                      </View>
                    </View>

                    {/* Progress Bar */}
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${remainingRatio * 100}%` }]} />
                      </View>
                      <Text style={styles.progressText}>{Math.round(remainingRatio * 100)}% remaining</Text>
                    </View>

                    <View style={styles.divider} />

                    {/* Footer Actions */}
                    <View style={styles.cardFooter}>
                      <View>
                        <Text style={styles.footerLabel}>Total Size</Text>
                        <Text style={styles.footerValue}>{batch.totalHens} Hens</Text>
                      </View>

                      <TouchableOpacity
                        onPress={() => openOrderForm(batch)}
                        disabled={batch.availableHens <= 0}
                        style={[styles.orderBtn, batch.availableHens <= 0 && styles.soldOutBtn]}
                      >
                        <Cock />
                        <Text style={[styles.orderBtnText, batch.availableHens <= 0 && styles.soldOutText]}>
                          {batch.availableHens > 0 ? "Order Now" : "Sold Out"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* ORDER FORM MODAL */}
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

  function formatDateForInput(d: Date) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  function onNativeDateChange(event: any, selected?: Date | undefined) {
    setShowNativeDatePicker(false);
    if (event?.type === "dismissed") return;
    if (selected) {
      setDeliveryDate(formatDateForInput(selected));
      setErrors((s) => ({ ...s, deliveryDate: "" }));
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
      const res = await rootApi.post(PLACE_ORDER_ENDPOINT, payload);
      if (res.status === 200 || res.status === 201) {
        Alert.alert("Success", "Your order has been placed.");
        onPlaced();
      } else {
        console.error("Place order failed", res.data);
        Alert.alert("Failed", "Your order is not placed.");
      }
    } catch (e: any) {
      const status = e?.response?.status;
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
    <View style={styles.modalOverlay}>
      <TouchableOpacity style={styles.backdrop} onPress={onClose} />
      
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <View>
            <Text style={styles.modalTitle}>Create Order</Text>
            <Text style={styles.modalSub}>Batch {batch.batchCode} • ID {batch.id}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Feather name="x" size={18} color="#334155" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          
          {/* Order Type Toggle */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleBox}>
              <View style={styles.toggleHeader}>
                 <Text style={styles.toggleLabel}>Quantity (Birds)</Text>
                 <TouchableOpacity onPress={() => setOrderBy("quantity")} style={[styles.radioBtn, orderBy === "quantity" && styles.radioBtnActive]}>
                    <View style={orderBy === "quantity" ? styles.radioInner : null} />
                 </TouchableOpacity>
              </View>
              <TextInput
                value={quantity}
                onChangeText={(t) => setQuantity(t.replace(/[^0-9]/g, ""))}
                keyboardType="numeric"
                style={[styles.input, errors.quantity && styles.inputError]}
                editable={orderBy === "quantity"}
              />
            </View>

            <View style={styles.toggleBox}>
              <View style={styles.toggleHeader}>
                 <Text style={styles.toggleLabel}>Weight (Kg)</Text>
                 <TouchableOpacity onPress={() => setOrderBy("weight")} style={[styles.radioBtn, orderBy === "weight" && styles.radioBtnActive]}>
                    <View style={orderBy === "weight" ? styles.radioInner : null} />
                 </TouchableOpacity>
              </View>
              <TextInput
                value={weight}
                onChangeText={(t) => setWeight(t.replace(/[^0-9.]/g, ""))}
                keyboardType="decimal-pad"
                style={[styles.input, errors.weight && styles.inputError]}
                editable={orderBy === "weight"}
              />
            </View>
          </View>

          {/* Form Fields */}
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Vendor Name</Text>
            <TextInput style={[styles.input, errors.vendorName && styles.inputError]} value={vendorName} onChangeText={setVendorName} placeholder="Enter name" />
            
            <View style={styles.row}>
                <View style={{flex: 1, marginRight: 8}}>
                    <Text style={styles.inputLabel}>Phone</Text>
                    <TextInput style={[styles.input, errors.phoneNumber && styles.inputError]} value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" placeholder="98..." />
                </View>
                <View style={{flex: 1}}>
                    <Text style={styles.inputLabel}>Shop Name</Text>
                    <TextInput style={[styles.input, errors.shopName && styles.inputError]} value={shopName} onChangeText={setShopName} placeholder="Shop Name" />
                </View>
            </View>

            <Text style={styles.inputLabel}>Address</Text>
            <TextInput style={[styles.input, styles.textArea, errors.address && styles.inputError]} value={address} onChangeText={setAddress} multiline placeholder="Full Address" />

            <Text style={styles.inputLabel}>Delivery Date</Text>
            {Platform.OS === "web" ? (
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e: any) => {
                    setDeliveryDate(e.target.value);
                    setErrors((s) => ({ ...s, deliveryDate: "" }));
                  }}
                  style={{
                    padding: 12, borderRadius: 10, width: "100%",
                    border: errors.deliveryDate ? "1px solid #f87171" : "1px solid #e2e8f0",
                    background: "#f8fafc", color: "#0f172a"
                  }}
                />
            ) : (
                <TouchableOpacity
                  onPress={() => setShowNativeDatePicker(true)}
                  style={[styles.input, errors.deliveryDate && styles.inputError]}
                >
                  <Text style={deliveryDate ? {color: '#0f172a'} : {color: '#94a3b8'}}>
                      {deliveryDate || "Select Date"}
                  </Text>
                </TouchableOpacity>
            )}
            {showNativeDatePicker && (
                <DateTimePicker value={deliveryDate ? new Date(deliveryDate) : new Date()} mode="date" display="default" onChange={onNativeDateChange} />
            )}
          </View>

          {/* Footer Actions */}
          <View style={styles.modalFooter}>
             <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                 <Text style={styles.cancelText}>Cancel</Text>
             </TouchableOpacity>
             <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
                 {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Confirm Order</Text>}
             </TouchableOpacity>
          </View>
          <View style={{height: 20}} />

        </ScrollView>
      </View>
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
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  headerSub: { color: '#ffedd5', fontSize: 13, marginTop: 2 },
  
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  navButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  navButtonText: { color: '#fff', fontWeight: '600' },
  logoutButton: { backgroundColor: '#fff', padding: 8, borderRadius: 20 },

  scrollContent: { padding: 16, paddingBottom: 40 },

  // Search & Filter
  searchRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  searchInput: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, fontSize: 15, color: '#0f172a', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  sortButton: { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', justifyContent: 'center' },
  sortButtonText: { color: '#475569', fontWeight: '600' },

  // States
  centerContainer: { alignItems: 'center', justifyContent: 'center', height: 200 },
  loadingText: { color: '#94a3b8', marginTop: 10 },
  
  errorBox: { backgroundColor: '#FEF2F2', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#FEE2E2' },
  errorTitle: { color: '#DC2626', fontWeight: 'bold', marginBottom: 4 },
  errorText: { color: '#DC2626', marginBottom: 10 },
  retryBtn: { backgroundColor: '#DC2626', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, alignSelf: 'flex-start' },
  retryText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },

  emptyBox: { alignItems: 'center', padding: 40, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  emptyText: { color: '#94a3b8', marginTop: 10 },

  // List Grid
  list: { flexDirection: 'column', gap: 16 },
  gridList: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  
  // Batch Card
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardWide: { width: '32%' }, // for wide screens
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  
  batchLabel: { fontSize: 12, color: '#94a3b8' },
  batchId: { fontWeight: 'bold', color: '#64748b' },
  batchCode: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginTop: 2 },
  breedText: { fontSize: 14, color: '#64748b' },
  dateText: { fontSize: 11, color: '#94a3b8', marginTop: 4 },

  availLabel: { fontSize: 11, color: '#64748b', marginBottom: 2 },
  availCount: { fontSize: 20, fontWeight: 'bold', color: '#ea580c' },
  totalText: { fontSize: 11, color: '#94a3b8' },

  progressContainer: { marginBottom: 12 },
  progressBarBg: { height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#f97316', borderRadius: 4 },
  progressText: { fontSize: 11, color: '#94a3b8', marginTop: 4, textAlign: 'right' },

  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 12 },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerLabel: { fontSize: 11, color: '#64748b' },
  footerValue: { fontSize: 14, fontWeight: '600', color: '#0f172a' },

  orderBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ea580c', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12 },
  soldOutBtn: { backgroundColor: '#e2e8f0' },
  orderBtnText: { color: '#fff', fontWeight: 'bold' },
  soldOutText: { color: '#94a3b8' },

  // --- MODAL STYLES ---
  modalOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 50, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '90%', width: '100%' },
  
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  modalSub: { fontSize: 13, color: '#64748b' },
  closeBtn: { backgroundColor: '#f1f5f9', padding: 8, borderRadius: 20 },

  toggleRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  toggleBox: { flex: 1, backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  toggleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  toggleLabel: { fontSize: 12, fontWeight: '600', color: '#475569' },
  
  radioBtn: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center' },
  radioBtnActive: { borderColor: '#ea580c' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ea580c' },

  formGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, fontSize: 15, color: '#0f172a' },
  inputError: { borderColor: '#f87171' },
  textArea: { height: 70, textAlignVertical: 'top' },
  
  row: { flexDirection: 'row' },

  modalFooter: { flexDirection: 'row', gap: 12, justifyContent: 'flex-end', marginTop: 10 },
  cancelBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, backgroundColor: '#f1f5f9' },
  cancelText: { color: '#475569', fontWeight: '600' },
  submitBtn: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, backgroundColor: '#ea580c' },
  submitText: { color: '#fff', fontWeight: 'bold' }
});