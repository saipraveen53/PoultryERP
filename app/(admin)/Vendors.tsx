import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { rootApi } from '../(utils)/axiosInstance';

// --- ORDER INTERFACE ---
interface Order {
  id: string;
  orderCode: string;
  vendorName: string;
  shopName: string;
  phone: string;
  address: string;
  breed: string;
  type: 'Weight' | 'Quantity';
  value: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISPATCHED' | 'DELIVERED';
  date: string;
  batchCode: string;
  fulfillment?: {
    vehicleNo: string | null;
    driverName: string | null;
    driverPhone: string | null;
    finalWeight: string | null;
    finalQuantity: string | null;
    pricePerKg: string | null;
    totalAmount: string | null;
  };
}

// --- BATCH INTERFACE ---
interface Batch {
  id: number;
  batchCode: string;
  breed: string;
  availableHens: number;
  weight: number;
}

// --- 1. SEPARATE COMPONENT FOR LIST ITEM (PREVENTS CRASH) ---
const OrderCard = React.memo(({ item, onReject, onAssign }: { item: Order, onReject: (id: string) => void, onAssign: (order: Order) => void }) => {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.vendorName}>{item.vendorName}</Text>
          <Text style={styles.shopName}>{item.shopName}</Text>
          <Text style={styles.address}>📍 {item.address}</Text>
          <Text style={styles.phone}>📞 {item.phone}</Text>
        </View>
        <View style={[
            styles.statusBadge, 
            item.status === 'PENDING' ? styles.statusPending : 
            item.status === 'DELIVERED' ? styles.statusDelivered : styles.statusRejected
        ]}>
          <Text style={[
             styles.statusText,
             item.status === 'PENDING' ? styles.textPending : 
             item.status === 'DELIVERED' ? styles.textDelivered : styles.textRejected
          ]}>
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.detailsRow}>
        <View>
            <Text style={styles.label}>Breed / Batch</Text>
            <Text style={styles.value}>{item.breed}</Text>
            <Text style={styles.subValue}>{item.batchCode}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.label}>Requested ({item.type})</Text>
            <Text style={styles.largeValue}>
                {item.value} <Text style={styles.unit}>{item.type === 'Weight' ? 'kg' : 'Birds'}</Text>
            </Text>
        </View>
      </View>

      {/* --- UPDATED DISPATCH REPORT SECTION --- */}
      {item.status !== 'PENDING' && item.fulfillment?.vehicleNo && (
        <View style={styles.dispatchBox}>
            <Text style={styles.dispatchTitle}>🚚 DISPATCH REPORT</Text>
            
            <View style={styles.dispatchRow}>
                <Text style={styles.dispatchLabel}>Vehicle:</Text>
                <Text style={styles.dispatchValue}>{item.fulfillment.vehicleNo}</Text>
            </View>
            <View style={styles.dispatchRow}>
                <Text style={styles.dispatchLabel}>Driver:</Text>
                <Text style={styles.dispatchValue}>{item.fulfillment.driverName} ({item.fulfillment.driverPhone})</Text>
            </View>

            {/* Price Info Added Here */}
            <View style={styles.dispatchDivider} />
            
            <View style={styles.dispatchRow}>
                <Text style={styles.dispatchLabel}>Final Weight:</Text>
                <Text style={styles.dispatchValue}>{item.fulfillment.finalWeight || '-'} kg</Text>
            </View>
            <View style={styles.dispatchRow}>
                <Text style={styles.dispatchLabel}>Price/Kg:</Text>
                <Text style={styles.dispatchValue}>₹{item.fulfillment.pricePerKg || '0'}</Text>
            </View>
            
            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Bill Amount:</Text>
                <Text style={styles.totalValue}>₹{item.fulfillment.totalAmount || '0'}</Text>
            </View>
        </View>
      )}

      {item.status === 'PENDING' && (
        <View style={styles.actionRow}>
            <TouchableOpacity 
                onPress={() => onReject(item.id)}
                style={[styles.actionBtn, styles.rejectBtn]}
            >
                <Text style={styles.rejectBtnText}>REJECT</Text>
            </TouchableOpacity>
            <TouchableOpacity 
                onPress={() => onAssign(item)}
                style={[styles.actionBtn, styles.acceptBtn]}
            >
                <Text style={styles.acceptBtnText}>ACCEPT & ASSIGN</Text>
            </TouchableOpacity>
        </View>
      )}

      <Text style={styles.footerDate}>{item.orderCode} • {item.date}</Text>
    </View>
  );
});

const Vendors = () => {
  // 1. STATE MANAGEMENT
  const [orders, setOrders] = useState<Order[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]); 
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'Pending' | 'Delivered'>('Pending');

  // Modal States
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [breedModalVisible, setBreedModalVisible] = useState(false); 
  
  // Selection States
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // --- FORM STATES (ADD ORDER) ---
  const [vendorName, setVendorName] = useState('');
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [orderType, setOrderType] = useState<'Weight' | 'Quantity'>('Weight');
  const [orderValue, setOrderValue] = useState('');
  
  // Batch & Breed State
  const [selectedBatchCode, setSelectedBatchCode] = useState(''); 
  const [selectedBatchId, setSelectedBatchId] = useState<number>(0);
  const [selectedBreed, setSelectedBreed] = useState('Select Batch First'); 

  // --- FORM STATES (ASSIGN VEHICLE) ---
  const [vehicleNo, setVehicleNo] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [finalWeight, setFinalWeight] = useState('');
  const [finalQuantity, setFinalQuantity] = useState('');
  const [pricePerKg, setPricePerKg] = useState('');
  
  // Auto-calc total
  const totalAmount = (parseFloat(finalWeight || '0') * parseFloat(pricePerKg || '0')).toFixed(0);

  // --- API URLS ---
  const GET_ORDERS_URL = 'http://192.168.0.110:8081/api/orders/admin/allOrders';
  const PLACE_ORDER_URL = 'http://192.168.0.110:8081/api/orders/vendor/place-order';
  const GET_STOCK_URL = 'http://192.168.0.110:8081/api/hens/getStock'; 

  // --- FETCH DATA ---
  const fetchData = async () => {
    if (!refreshing) setLoading(true); // Don't show full loader on pull-to-refresh
    try {
      // 1. Fetch Orders
      const ordersRes = await rootApi.get(GET_ORDERS_URL);
      if (ordersRes.status === 200 && Array.isArray(ordersRes.data)) {
        const mappedOrders: Order[] = ordersRes.data.map((item: any) => ({
          id: item.id.toString(),
          orderCode: item.orderCode,
          vendorName: item.vendorName,
          shopName: item.shopName || '',
          phone: item.phoneNumber,
          address: item.address,
          breed: item.breed || 'Broiler',
          type: item.quantity > 0 ? 'Quantity' : 'Weight',
          value: item.quantity > 0 ? item.quantity.toString() : item.weight.toString(),
          status: item.status,
          date: new Date(item.orderDate).toLocaleString(),
          batchCode: item.batchCode,
          fulfillment: {
            vehicleNo: item.vehicleNumber,
            driverName: item.driverName,
            driverPhone: item.driverPhone,
            // Use receivedWeight if available (for Dispatched orders), else weight
            finalWeight: item.receivedWeight ? item.receivedWeight.toString() : (item.weight ? item.weight.toString() : null),
            finalQuantity: item.receivedQuantity ? item.receivedQuantity.toString() : (item.quantity ? item.quantity.toString() : null),
            // Map Price Info
            pricePerKg: item.pricePerKg ? item.pricePerKg.toString() : null,
            totalAmount: item.totalPrice ? item.totalPrice.toString() : null
          }
        }));
        setOrders(mappedOrders.reverse());
      }

      // 2. Fetch Batches
      const stockRes = await rootApi.get(GET_STOCK_URL);
      if (stockRes.status === 200 && Array.isArray(stockRes.data)) {
        setBatches(stockRes.data);
      }

    } catch (error) {
      console.error("Fetch Data Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // --- ACTIONS ---
  const handleAddOrder = async () => {
    if (!vendorName || !phone || !orderValue || !address || !shopName || !selectedBatchCode) {
      Alert.alert("Missing Details", "Please fill all details including Batch Code.");
      return;
    }

    if (selectedBatchId === 0) {
        Alert.alert("Invalid Batch", "Please select a valid Batch from the list.");
        return;
    }

    setLoading(true);
    try {
      const payload = {
        vendorName: vendorName,
        phoneNumber: phone,
        shopName: shopName,
        address: address,
        batchCode: selectedBatchCode,
        batchId: selectedBatchId,
        breed: selectedBreed, 
        deliveryDate: new Date().toISOString().split('T')[0],
        quantity: orderType === 'Quantity' ? parseInt(orderValue) : 0,
        weight: orderType === 'Weight' ? parseFloat(orderValue) : 0,
      };

      const response = await rootApi.post(PLACE_ORDER_URL, payload);

      if (response.status === 200 || response.status === 201) {
        Alert.alert("Success", "Order Created Successfully!");
        setAddModalVisible(false);
        resetAddForm();
        fetchData();
      }
    } catch (error) {
      console.error("Place Order Error:", error);
      Alert.alert("Failed", "Could not place order. Check network.");
    } finally {
      setLoading(false);
    }
  };

  const resetAddForm = () => {
    setVendorName('');
    setShopName('');
    setPhone('');
    setAddress('');
    setOrderValue('');
    setOrderType('Weight');
    setSelectedBatchCode('');
    setSelectedBatchId(0);
    setSelectedBreed('Select Batch First');
  };

  // --- HANDLERS (Wrapped in useCallback) ---
  const openAssignModal = useCallback((order: Order) => {
    setSelectedOrder(order);
    setAssignModalVisible(true);
    setVehicleNo('');
    setDriverName('');
    setDriverPhone('');
    setFinalWeight('');
    setFinalQuantity(order.type === 'Quantity' ? order.value : '');
    setPricePerKg('');
  }, []);

  const handleReject = useCallback((id: string) => {
    Alert.alert("Confirm Reject", "Are you sure you want to reject this order?", [
        { text: "Cancel", style: "cancel" },
        { 
            text: "Reject", 
            style: "destructive", 
            onPress: () => {
                setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'REJECTED' as const } : o));
            }
        }
    ]);
  }, []);

  const handleConfirmAssignment = async () => {
    if(!selectedOrder) return;
    if(!vehicleNo || !driverName || !driverPhone || !finalWeight || !pricePerKg) {
        Alert.alert("Missing Info", "Please enter all details.");
        return;
    }

    setLoading(true);
    try {
      const ADD_DELIVERY_URL = `http://192.168.0.110:8081/api/orders/admin/add-delivery/${selectedOrder.id}`;
      
      const payload = {
        vehicleNumber: vehicleNo,
        driverName: driverName,
        driverPhone: driverPhone,
        weight: parseFloat(finalWeight),
        quantity: parseInt(finalQuantity || '0'),
        pricePerKg: parseFloat(pricePerKg),
        totalAmount: parseFloat(totalAmount)
      };

      const response = await rootApi.post(ADD_DELIVERY_URL, payload);

      if (response.status === 200 || response.status === 201) {
        Alert.alert("Success", `Order Processed! Total: ₹${totalAmount}`);
        setAssignModalVisible(false);
        fetchData();
      }
    } catch (error) {
      console.error("Assignment Error:", error);
      Alert.alert("Failed", "Could not assign delivery.");
    } finally {
      setLoading(false);
    }
  };

  // --- FILTER ---
  const filteredData = activeTab === 'Pending' 
    ? orders.filter(o => o.status === 'PENDING')
    : orders.filter(o => o.status !== 'PENDING');

  // --- 2. RENDER ITEM (Optimized) ---
  const renderItem = useCallback(({ item }: { item: Order }) => (
    <OrderCard 
        item={item} 
        onReject={handleReject} 
        onAssign={openAssignModal} 
    />
  ), [handleReject, openAssignModal]);

  return (
    <View style={styles.container}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
            <View>
                <Text style={styles.headerSub}>Vendor Management</Text>
                <Text style={styles.headerTitle}>Orders List</Text>
            </View>
            <TouchableOpacity 
                style={styles.addButton}
                onPress={() => setAddModalVisible(true)}
            >
                <Ionicons name="add" size={26} color="#ea580c" />
            </TouchableOpacity>
        </View>
      </View>

      {/* TAB SWITCHER */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
            style={[styles.tab, activeTab === 'Pending' && styles.activeTab]}
            onPress={() => setActiveTab('Pending')}
        >
            <Text style={[styles.tabText, activeTab === 'Pending' && styles.activeTabText]}>Pending</Text>
        </TouchableOpacity>
        <TouchableOpacity 
            style={[styles.tab, activeTab === 'Delivered' && styles.activeTab]}
            onPress={() => setActiveTab('Delivered')}
        >
            <Text style={[styles.tabText, activeTab === 'Delivered' && styles.activeTabText2]}>Delivered</Text>
        </TouchableOpacity>
      </View>

      {/* LIST CONTENT */}
      {loading && !refreshing ? (
          <View style={styles.center}><ActivityIndicator size="large" color="#ea580c" /></View>
      ) : (
          <FlatList
            data={filteredData}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
                <View style={styles.center}>
                    <Ionicons name={activeTab === 'Pending' ? "time-outline" : "checkmark-done-circle-outline"} size={50} color="gray" />
                    <Text style={styles.emptyText}>No {activeTab} Orders Found</Text>
                </View>
            }
          />
      )}

      {/* --- ADD MODAL --- */}
      <Modal animationType="slide" transparent={true} visible={addModalVisible} onRequestClose={() => setAddModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Order 📝</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 20}}>
                <Text style={styles.inputLabel}>VENDOR NAME</Text>
                <TextInput style={styles.input} placeholder="e.g. Ramesh" value={vendorName} onChangeText={setVendorName} />
                
                <Text style={styles.inputLabel}>SHOP NAME</Text>
                <TextInput style={styles.input} placeholder="e.g. Ramesh Chicken Center" value={shopName} onChangeText={setShopName} />
                
                <Text style={styles.inputLabel}>PHONE</Text>
                <TextInput style={styles.input} placeholder="e.g. 98480..." keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
                
                <Text style={styles.inputLabel}>DELIVERY ADDRESS</Text>
                <TextInput style={[styles.input, {height: 60}]} placeholder="Full Address" value={address} onChangeText={setAddress} multiline />

                {/* BATCH SELECTION */}
                <Text style={styles.inputLabel}>BATCH CODE (SELECT FROM STOCK)</Text>
                <TouchableOpacity style={[styles.input, {justifyContent: 'space-between', flexDirection: 'row', alignItems:'center'}]} onPress={() => setBreedModalVisible(true)}>
                    <Text style={selectedBatchCode ? styles.inputText : styles.placeholderText}>
                        {selectedBatchCode || "Select Batch"}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="gray" />
                </TouchableOpacity>

                <Text style={styles.inputLabel}>BREED (AUTO-FILLED)</Text>
                <View style={[styles.input, {backgroundColor: '#F3F4F6'}]}>
                    <Text style={{color: '#4B5563'}}>{selectedBreed}</Text>
                </View>

                <Text style={styles.inputLabel}>ORDER BY</Text>
                <View style={styles.radioContainer}>
                    <TouchableOpacity style={[styles.radioBtn, orderType === 'Weight' && styles.radioActive]} onPress={() => setOrderType('Weight')}>
                        <Text style={[styles.radioText, orderType === 'Weight' && styles.radioTextActive]}>Weight (Kg)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.radioBtn, orderType === 'Quantity' && styles.radioActive]} onPress={() => setOrderType('Quantity')}>
                        <Text style={[styles.radioText, orderType === 'Quantity' && styles.radioTextActive]}>Quantity (Birds)</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.inputLabel}>{orderType === 'Weight' ? 'WEIGHT (KG)' : 'QUANTITY (BIRDS)'}</Text>
                <TextInput style={[styles.input, {fontWeight: 'bold', fontSize: 18}]} placeholder="0" keyboardType="numeric" value={orderValue} onChangeText={setOrderValue} />

                <TouchableOpacity style={styles.submitBtn} onPress={handleAddOrder} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>CREATE ORDER</Text>}
                </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* --- ASSIGN MODAL --- */}
      <Modal animationType="slide" transparent={true} visible={assignModalVisible} onRequestClose={() => setAssignModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
             <View style={styles.modalHeader}>
                <View>
                    <Text style={styles.modalTitle}>Assign Vehicle 🚚</Text>
                    <Text style={styles.modalSub}>For: {selectedOrder?.vendorName}</Text>
                </View>
                <TouchableOpacity onPress={() => setAssignModalVisible(false)} style={styles.closeBtn}>
                    <Ionicons name="close" size={22} color="#374151" />
                </TouchableOpacity>
             </View>

             <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionHeader}>TRANSPORT DETAILS</Text>
                
                <Text style={styles.inputLabel}>VEHICLE NO</Text>
                <TextInput style={styles.input} placeholder="TS07..." value={vehicleNo} onChangeText={setVehicleNo} />
                
                <View style={styles.row}>
                    <View style={{flex: 1, marginRight: 8}}>
                        <Text style={styles.inputLabel}>DRIVER NAME</Text>
                        <TextInput style={styles.input} placeholder="Name" value={driverName} onChangeText={setDriverName} />
                    </View>
                    <View style={{flex: 1}}>
                        <Text style={styles.inputLabel}>DRIVER PHONE</Text>
                        <TextInput style={styles.input} placeholder="98..." keyboardType="phone-pad" value={driverPhone} onChangeText={setDriverPhone} />
                    </View>
                </View>

                <Text style={[styles.sectionHeader, {marginTop: 15}]}>BILLING & MEASUREMENT</Text>
                
                <View style={styles.row}>
                    <View style={{flex: 1, marginRight: 8}}>
                        <Text style={styles.inputLabel}>TOTAL WEIGHT (KG)</Text>
                        <TextInput style={[styles.input, styles.boldInput]} placeholder="0.0" keyboardType="numeric" value={finalWeight} onChangeText={setFinalWeight} />
                    </View>
                    <View style={{flex: 1}}>
                        <Text style={styles.inputLabel}>TOTAL HENS (QTY)</Text>
                        <TextInput style={[styles.input, styles.boldInput]} placeholder="0" keyboardType="numeric" value={finalQuantity} onChangeText={setFinalQuantity} />
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={{flex: 1, marginRight: 8}}>
                        <Text style={styles.inputLabel}>PRICE PER KG (₹)</Text>
                        <TextInput style={[styles.input, styles.boldInput]} placeholder="0" keyboardType="numeric" value={pricePerKg} onChangeText={setPricePerKg} />
                    </View>
                    <View style={{flex: 1}}>
                        <Text style={styles.inputLabel}>TOTAL AMOUNT (₹)</Text>
                        <View style={styles.totalBox}>
                            <Text style={styles.totalText}>{totalAmount !== 'NaN' ? totalAmount : '0'}</Text>
                        </View>
                    </View>
                </View>

                <TouchableOpacity style={[styles.submitBtn, {backgroundColor: '#16a34a', marginTop: 20}]} onPress={handleConfirmAssignment} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff"/> : <Text style={styles.submitBtnText}>CONFIRM & DISPATCH 🚚</Text>}
                </TouchableOpacity>
             </ScrollView>
          </View>
        </View>
      </Modal>

      {/* --- STOCK BATCH SELECTION MODAL --- */}
      <Modal animationType="fade" transparent={true} visible={breedModalVisible} onRequestClose={() => setBreedModalVisible(false)}>
        <View style={[styles.modalOverlay, {justifyContent: 'center', alignItems: 'center', padding: 20}]}>
            <View style={[styles.modalContent, {width: '100%', maxHeight: 400}]}>
                <Text style={[styles.modalTitle, {textAlign: 'center', marginBottom: 15}]}>Select Stock Batch</Text>
                
                {batches.length === 0 ? (
                    <Text style={{textAlign: 'center', color: 'gray', marginBottom: 20}}>No Batches Available. Add Stock in Dashboard first.</Text>
                ) : (
                    <FlatList 
                        data={batches}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({item}) => (
                            <TouchableOpacity 
                                style={[styles.batchItem, selectedBatchCode === item.batchCode && styles.batchItemActive]}
                                onPress={() => { 
                                    setSelectedBatchCode(item.batchCode);
                                    setSelectedBatchId(item.id);
                                    setSelectedBreed(item.breed || 'Unknown');
                                    setBreedModalVisible(false); 
                                }}
                            >
                                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                                    <View>
                                        <Text style={styles.batchCode}>{item.batchCode}</Text>
                                        <Text style={styles.batchInfo}>{item.breed} • Stock: {item.availableHens}</Text>
                                    </View>
                                    {selectedBatchCode === item.batchCode && <Ionicons name="checkmark-circle" size={24} color="#ea580c" />}
                                </View>
                            </TouchableOpacity>
                        )}
                    />
                )}

                <TouchableOpacity style={styles.cancelBtn} onPress={() => setBreedModalVisible(false)}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
            </View>
        </View>
      </Modal>

    </View>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: 'gray', marginTop: 10, fontSize: 16, fontWeight: '500' },
  
  // Header
  header: { backgroundColor: '#ea580c', paddingTop: 40, paddingBottom: 20, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, marginBottom: 15, elevation: 5 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerSub: { color: '#ffedd5', fontSize: 14, fontWeight: '500' },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  addButton: { backgroundColor: '#fff', padding: 10, borderRadius: 25, elevation: 3 },

  // Tabs
  tabContainer: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 15, backgroundColor: '#E5E7EB', borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  activeTab: { backgroundColor: '#fff', elevation: 2 },
  tabText: { fontWeight: 'bold', fontSize: 14, color: '#6B7280' },
  activeTabText: { color: '#ea580c' },
  activeTabText2: { color: '#16a34a' },

  // Cards
  card: { backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 15, padding: 15, borderRadius: 16, elevation: 2, borderWidth: 1, borderColor: '#F3F4F6' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  vendorName: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  shopName: { fontSize: 12, fontWeight: '600', color: '#4B5563', marginBottom: 2 },
  address: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  phone: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusPending: { backgroundColor: '#FFEDD5' },
  statusDelivered: { backgroundColor: '#DCFCE7' },
  statusRejected: { backgroundColor: '#FEE2E2' },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  textPending: { color: '#C2410C' },
  textDelivered: { color: '#15803D' },
  textRejected: { color: '#B91C1C' },

  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },

  detailsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  label: { color: '#9CA3AF', fontSize: 10, textTransform: 'uppercase', fontWeight: 'bold' },
  value: { fontSize: 14, fontWeight: '600', color: '#374151' },
  subValue: { fontSize: 10, color: '#9CA3AF' },
  largeValue: { fontSize: 20, fontWeight: 'bold', color: '#ea580c' },
  unit: { fontSize: 14, fontWeight: 'normal', color: '#6B7280' },

  // Updated Dispatch Box Styles
  dispatchBox: { backgroundColor: '#F9FAFB', padding: 12, borderRadius: 12, marginTop: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  dispatchTitle: { color: '#1F2937', fontWeight: 'bold', fontSize: 12, marginBottom: 8, letterSpacing: 0.5 },
  dispatchRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  dispatchLabel: { fontSize: 11, color: '#6B7280', fontWeight: '500' },
  dispatchValue: { fontSize: 11, color: '#374151', fontWeight: 'bold' },
  dispatchDivider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 6 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, paddingTop: 4, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  totalLabel: { fontSize: 12, color: '#15803D', fontWeight: 'bold' },
  totalValue: { fontSize: 14, color: '#15803D', fontWeight: 'bold' },

  actionRow: { flexDirection: 'row', gap: 10, marginTop: 15 },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rejectBtn: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FEE2E2' },
  acceptBtn: { backgroundColor: '#ea580c', elevation: 2 },
  rejectBtnText: { color: '#DC2626', fontWeight: 'bold', fontSize: 12 },
  acceptBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },

  footerDate: { textAlign: 'right', fontSize: 10, color: '#D1D5DB', marginTop: 10 },

  // Modal Styles
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  modalSub: { fontSize: 12, color: '#9CA3AF' },
  closeBtn: { backgroundColor: '#F3F4F6', padding: 8, borderRadius: 20 },

  inputLabel: { fontSize: 12, fontWeight: 'bold', color: '#6B7280', marginBottom: 6, marginLeft: 2 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, marginBottom: 15, fontSize: 14, color: '#1F2937' },
  placeholderText: { color: '#9CA3AF' },
  inputText: { color: '#1F2937', fontWeight: '500' },
  boldInput: { fontWeight: 'bold', fontSize: 16 },

  radioContainer: { flexDirection: 'row', backgroundColor: '#F3F4F6', padding: 4, borderRadius: 10, marginBottom: 15 },
  radioBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  radioActive: { backgroundColor: '#fff', elevation: 1 },
  radioText: { fontSize: 12, fontWeight: 'bold', color: '#9CA3AF' },
  radioTextActive: { color: '#ea580c' },

  submitBtn: { backgroundColor: '#ea580c', paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  row: { flexDirection: 'row' },
  sectionHeader: { color: '#ea580c', fontWeight: 'bold', fontSize: 12, letterSpacing: 1, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 5 },
  totalBox: { backgroundColor: '#DCFCE7', borderWidth: 1, borderColor: '#BBF7D0', borderRadius: 10, padding: 12, alignItems: 'center', justifyContent: 'center' },
  totalText: { color: '#15803D', fontWeight: 'bold', fontSize: 18 },

  // Batch List
  batchItem: { padding: 15, marginBottom: 10, borderRadius: 12, borderWidth: 1, borderColor: '#F3F4F6', backgroundColor: '#fff' },
  batchItemActive: { backgroundColor: '#FFF7ED', borderColor: '#F97316' },
  batchCode: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  batchInfo: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  cancelBtn: { marginTop: 10, padding: 12, backgroundColor: '#F3F4F6', borderRadius: 10, alignItems: 'center' },
  cancelBtnText: { color: '#6B7280', fontWeight: 'bold' }
});

export default Vendors;