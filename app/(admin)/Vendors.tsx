import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
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
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DELIVERED';
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

// --- BATCH INTERFACE (From getStock) ---
interface Batch {
  id: number;
  batchCode: string;
  breed: string;
  availableHens: number;
  weight: number;
}

const Vendors = () => {
  // 1. STATE MANAGEMENT
  const [orders, setOrders] = useState<Order[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]); // Store Batches Here
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'Pending' | 'Delivered'>('Pending');

  // Modal States
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [breedModalVisible, setBreedModalVisible] = useState(false); // Used for Batch Select now
  
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
  const [selectedBreed, setSelectedBreed] = useState('Select Batch First'); // Auto-filled

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
  const GET_ORDERS_URL = 'http://192.168.0.217:8081/api/orders/admin/allOrders';
  const PLACE_ORDER_URL = 'http://192.168.0.217:8081/api/orders/vendor/place-order';
  const GET_STOCK_URL = 'http://192.168.0.217:8081/api/hens/getStock'; // To find Batch ID

  // --- FETCH DATA (Orders & Batches) ---
  const fetchData = async () => {
    setRefreshing(true);
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
            finalWeight: item.weight ? item.weight.toString() : null,
            finalQuantity: item.quantity ? item.quantity.toString() : null,
            pricePerKg: null,
            totalAmount: null
          }
        }));
        setOrders(mappedOrders.reverse());
      }

      // 2. Fetch Batches (For Dropdown)
      const stockRes = await rootApi.get(GET_STOCK_URL);
      if (stockRes.status === 200 && Array.isArray(stockRes.data)) {
        setBatches(stockRes.data);
      }

    } catch (error) {
      console.error("Fetch Data Error:", error);
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  // --- ACTION: ADD NEW ORDER ---
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
      // Payload with Auto-Found Batch ID
      const payload = {
        vendorName: vendorName,
        phoneNumber: phone,
        shopName: shopName,
        address: address,
        batchCode: selectedBatchCode,
        batchId: selectedBatchId, // Solution: ID from selected batch
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

  // --- ACTION: ACCEPT & ASSIGN ---
  const openAssignModal = (order: Order) => {
    setSelectedOrder(order);
    setAssignModalVisible(true);
    setVehicleNo('');
    setDriverName('');
    setDriverPhone('');
    setFinalWeight('');
    setFinalQuantity(order.type === 'Quantity' ? order.value : '');
    setPricePerKg('');
  };

  // --- ACTION: REJECT ---
  const handleReject = (id: string) => {
    Alert.alert("Confirm Reject", "Are you sure you want to reject this order?", [
        { text: "Cancel", style: "cancel" },
        { 
            text: "Reject", 
            style: "destructive", 
            onPress: () => {
                // Mock update for reject logic as endpoint isn't specified
                const updatedOrders = orders.map(o => o.id === id ? { ...o, status: 'REJECTED' as const } : o);
                setOrders(updatedOrders);
            }
        }
    ]);
  };

  // --- ACTION: CONFIRM ASSIGNMENT ---
  const handleConfirmAssignment = async () => {
    if(!selectedOrder) return;
    if(!vehicleNo || !driverName || !driverPhone || !finalWeight || !pricePerKg) {
        Alert.alert("Missing Info", "Please enter all details.");
        return;
    }

    setLoading(true);
    try {
      const ADD_DELIVERY_URL = `http://192.168.0.217:8081/api/orders/admin/add-delivery/${selectedOrder.id}`;
      
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

  // --- RENDER ORDER ITEM ---
  const renderOrderItem = ({ item }: { item: Order }) => (
    <View className="bg-white mx-5 mb-4 p-4 rounded-2xl shadow-sm border border-gray-100">
      <View className="flex-row justify-between items-start">
        <View className="flex-1 mr-2">
          <Text className="text-gray-800 font-bold text-lg">{item.vendorName}</Text>
          <Text className="text-gray-600 text-xs font-semibold">{item.shopName}</Text>
          <Text className="text-gray-500 text-xs mt-1">📍 {item.address}</Text>
          <Text className="text-gray-400 text-xs mt-0.5">📞 {item.phone}</Text>
        </View>
        <View className={`px-3 py-1 rounded-full ${
            item.status === 'PENDING' ? 'bg-orange-100' : 
            item.status === 'DELIVERED' ? 'bg-green-100' : 'bg-red-100'
        }`}>
          <Text className={`text-[10px] font-bold ${
             item.status === 'PENDING' ? 'text-orange-700' : 
             item.status === 'DELIVERED' ? 'text-green-700' : 'text-red-700'
          }`}>
            {item.status}
          </Text>
        </View>
      </View>

      <View className="h-[1px] bg-gray-100 my-3" />

      <View className="flex-row justify-between items-center mb-2">
        <View>
            <Text className="text-gray-400 text-[10px] uppercase">Breed / Batch</Text>
            <Text className="text-gray-700 font-semibold text-sm">{item.breed}</Text>
            <Text className="text-gray-400 text-[10px]">{item.batchCode}</Text>
        </View>
        <View>
            <Text className="text-gray-400 text-[10px] uppercase text-right">Requested ({item.type})</Text>
            <Text className="text-orange-600 font-bold text-lg text-right">
                {item.value} <Text className="text-sm font-normal text-gray-500">{item.type === 'Weight' ? 'kg' : 'Birds'}</Text>
            </Text>
        </View>
      </View>

      {item.status !== 'PENDING' && item.fulfillment?.vehicleNo && (
        <View className="bg-gray-50 p-3 rounded-xl mt-2 border border-gray-200">
            <Text className="text-gray-800 font-bold text-xs mb-1">🚚 DISPATCH REPORT</Text>
            <Text className="text-gray-600 text-xs">Veh: {item.fulfillment.vehicleNo} | Driver: {item.fulfillment.driverName}</Text>
            <Text className="text-green-700 text-xs font-bold mt-1">Bill Amount: ₹{item.fulfillment.totalAmount}</Text>
        </View>
      )}

      {item.status === 'PENDING' && (
        <View className="flex-row gap-3 mt-4">
            <TouchableOpacity 
                onPress={() => handleReject(item.id)}
                className="flex-1 bg-red-50 py-3 rounded-xl items-center border border-red-100"
            >
                <Text className="text-red-600 font-bold text-xs">REJECT</Text>
            </TouchableOpacity>
            <TouchableOpacity 
                onPress={() => openAssignModal(item)}
                className="flex-1 bg-orange-600 py-3 rounded-xl items-center shadow-sm"
            >
                <Text className="text-white font-bold text-xs">ACCEPT & ASSIGN</Text>
            </TouchableOpacity>
        </View>
      )}

      <Text className="text-gray-300 text-[10px] mt-3 text-right">{item.orderCode} • {item.date}</Text>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      
      {/* HEADER */}
      <View className="bg-orange-600 pt-12 pb-6 px-6 rounded-b-[30px] shadow-lg mb-4">
        <View className="flex-row justify-between items-center">
            <View>
                <Text className="text-orange-100 text-sm font-medium">Vendor Management</Text>
                <Text className="text-white text-2xl font-bold">Orders List</Text>
            </View>
            <TouchableOpacity 
                className="bg-white p-3 rounded-full shadow-md active:opacity-90"
                onPress={() => setAddModalVisible(true)}
            >
                <Ionicons name="add" size={26} color="#ea580c" />
            </TouchableOpacity>
        </View>
      </View>

      {/* TAB SWITCHER */}
      <View className="flex-row mx-5 mb-4 bg-gray-200 rounded-xl p-1">
        <TouchableOpacity 
            className={`flex-1 py-3 rounded-lg items-center ${activeTab === 'Pending' ? 'bg-white shadow-sm' : ''}`}
            onPress={() => setActiveTab('Pending')}
        >
            <Text className={`font-bold text-sm ${activeTab === 'Pending' ? 'text-orange-600' : 'text-gray-500'}`}>Pending</Text>
        </TouchableOpacity>
        <TouchableOpacity 
            className={`flex-1 py-3 rounded-lg items-center ${activeTab === 'Delivered' ? 'bg-white shadow-sm' : ''}`}
            onPress={() => setActiveTab('Delivered')}
        >
            <Text className={`font-bold text-sm ${activeTab === 'Delivered' ? 'text-green-600' : 'text-gray-500'}`}>Delivered</Text>
        </TouchableOpacity>
      </View>

      {/* LIST CONTENT */}
      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id}
        renderItem={renderOrderItem}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
            <View className="items-center justify-center mt-20 opacity-50">
                <Ionicons name={activeTab === 'Pending' ? "time-outline" : "checkmark-done-circle-outline"} size={50} color="gray" />
                <Text className="text-gray-400 mt-2 font-medium">No {activeTab} Orders Found</Text>
            </View>
        }
      />

      {/* --- ADD MODAL --- */}
      <Modal animationType="slide" transparent={true} visible={addModalVisible} onRequestClose={() => setAddModalVisible(false)}>
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-white rounded-t-3xl p-6 h-[90%] shadow-2xl">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-gray-800">New Order 📝</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)} className="bg-gray-100 p-2 rounded-full">
                <Ionicons name="close" size={22} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 20}}>
              <View className="space-y-4">
                <View>
                    <Text className="text-gray-500 text-xs font-bold mb-1 ml-1">VENDOR NAME</Text>
                    <TextInput className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800" placeholder="e.g. Ramesh" value={vendorName} onChangeText={setVendorName} />
                </View>
                <View>
                    <Text className="text-gray-500 text-xs font-bold mb-1 ml-1">SHOP NAME</Text>
                    <TextInput className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800" placeholder="e.g. Ramesh Chicken Center" value={shopName} onChangeText={setShopName} />
                </View>
                <View>
                    <Text className="text-gray-500 text-xs font-bold mb-1 ml-1">PHONE</Text>
                    <TextInput className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800" placeholder="e.g. 98480..." keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
                </View>
                <View>
                    <Text className="text-gray-500 text-xs font-bold mb-1 ml-1">DELIVERY ADDRESS</Text>
                    <TextInput className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800" placeholder="Full Address" value={address} onChangeText={setAddress} multiline />
                </View>

                {/* BATCH SELECTION (Populates ID & Breed) */}
                <View>
                    <Text className="text-gray-500 text-xs font-bold mb-1 ml-1">BATCH CODE (SELECT FROM STOCK)</Text>
                    <TouchableOpacity className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex-row justify-between" onPress={() => setBreedModalVisible(true)}>
                        <Text className={`text-gray-800 ${selectedBatchCode ? 'font-bold' : 'text-gray-400'}`}>
                            {selectedBatchCode || "Select Batch"}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="gray" />
                    </TouchableOpacity>
                </View>

                <View>
                    <Text className="text-gray-500 text-xs font-bold mb-1 ml-1">BREED (AUTO-FILLED)</Text>
                    <View className="bg-gray-100 border border-gray-200 rounded-xl px-4 py-3">
                        <Text className="text-gray-600">{selectedBreed}</Text>
                    </View>
                </View>

                <View>
                    <Text className="text-gray-500 text-xs font-bold mb-2 ml-1">ORDER BY</Text>
                    <View className="flex-row bg-gray-100 p-1 rounded-xl">
                        <TouchableOpacity className={`flex-1 py-3 rounded-lg items-center ${orderType === 'Weight' ? 'bg-white shadow-sm' : ''}`} onPress={() => setOrderType('Weight')}>
                            <Text className={`font-bold text-xs ${orderType === 'Weight' ? 'text-orange-600' : 'text-gray-400'}`}>Weight (Kg)</Text>
                        </TouchableOpacity>
                        <TouchableOpacity className={`flex-1 py-3 rounded-lg items-center ${orderType === 'Quantity' ? 'bg-white shadow-sm' : ''}`} onPress={() => setOrderType('Quantity')}>
                            <Text className={`font-bold text-xs ${orderType === 'Quantity' ? 'text-orange-600' : 'text-gray-400'}`}>Quantity (Birds)</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View>
                    <Text className="text-gray-500 text-xs font-bold mb-1 ml-1">{orderType === 'Weight' ? 'WEIGHT (KG)' : 'QUANTITY (BIRDS)'}</Text>
                    <TextInput className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 font-bold text-lg" placeholder="0" keyboardType="numeric" value={orderValue} onChangeText={setOrderValue} />
                </View>
              </View>

              <TouchableOpacity className={`mt-6 py-4 rounded-xl items-center ${loading ? 'bg-orange-300' : 'bg-orange-600'}`} onPress={handleAddOrder} disabled={loading}>
                 {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold">CREATE ORDER</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* --- ASSIGN MODAL --- */}
      <Modal animationType="slide" transparent={true} visible={assignModalVisible} onRequestClose={() => setAssignModalVisible(false)}>
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-white rounded-t-3xl p-6 h-[85%] shadow-2xl">
             <View className="flex-row justify-between items-center mb-4">
                <View>
                    <Text className="text-xl font-bold text-gray-800">Assign Vehicle 🚚</Text>
                    <Text className="text-xs text-gray-400">For: {selectedOrder?.vendorName}</Text>
                </View>
                <TouchableOpacity onPress={() => setAssignModalVisible(false)} className="bg-gray-100 p-2 rounded-full">
                    <Ionicons name="close" size={22} color="#374151" />
                </TouchableOpacity>
             </View>

             <ScrollView showsVerticalScrollIndicator={false}>
                <Text className="text-orange-600 font-bold text-xs mb-3 tracking-widest border-b border-gray-100 pb-1">TRANSPORT DETAILS</Text>
                <View className="space-y-4 mb-4">
                    <View>
                        <Text className="text-gray-500 text-[10px] font-bold mb-1">VEHICLE NO</Text>
                        <TextInput className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-gray-800" placeholder="TS07..." value={vehicleNo} onChangeText={setVehicleNo} />
                    </View>
                    <View className="flex-row space-x-3">
                        <View className="flex-1">
                            <Text className="text-gray-500 text-[10px] font-bold mb-1">DRIVER NAME</Text>
                            <TextInput className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-gray-800" placeholder="Name" value={driverName} onChangeText={setDriverName} />
                        </View>
                        <View className="flex-1">
                            <Text className="text-gray-500 text-[10px] font-bold mb-1">DRIVER PHONE</Text>
                            <TextInput className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-gray-800" placeholder="98..." keyboardType="phone-pad" value={driverPhone} onChangeText={setDriverPhone} />
                        </View>
                    </View>
                </View>

                <Text className="text-orange-600 font-bold text-xs mb-3 tracking-widest border-b border-gray-100 pb-1 mt-2">BILLING & MEASUREMENT</Text>
                
                <View className="flex-row space-x-3 mb-4">
                    <View className="flex-1">
                        <Text className="text-gray-500 text-xs font-bold mb-1 ml-1">TOTAL WEIGHT (KG)</Text>
                        <TextInput className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 font-bold text-lg" placeholder="0.0" keyboardType="numeric" value={finalWeight} onChangeText={setFinalWeight} />
                    </View>
                    <View className="flex-1">
                        <Text className="text-gray-500 text-xs font-bold mb-1 ml-1">TOTAL HENS (QTY)</Text>
                        <TextInput className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 font-bold text-lg" placeholder="0" keyboardType="numeric" value={finalQuantity} onChangeText={setFinalQuantity} />
                    </View>
                </View>

                <View className="flex-row space-x-3 mb-4">
                    <View className="flex-1">
                        <Text className="text-gray-500 text-xs font-bold mb-1 ml-1">PRICE PER KG (₹)</Text>
                        <TextInput className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 font-bold text-lg" placeholder="0" keyboardType="numeric" value={pricePerKg} onChangeText={setPricePerKg} />
                    </View>
                    <View className="flex-1">
                        <Text className="text-gray-500 text-xs font-bold mb-1 ml-1">TOTAL AMOUNT (₹)</Text>
                        <View className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 justify-center">
                            <Text className="text-green-700 font-bold text-lg">{totalAmount !== 'NaN' ? totalAmount : '0'}</Text>
                        </View>
                    </View>
                </View>

                <TouchableOpacity className={`mt-6 py-4 rounded-xl items-center shadow-lg mb-10 ${loading ? 'bg-green-400' : 'bg-green-600'}`} onPress={handleConfirmAssignment} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff"/> : <Text className="text-white font-bold">CONFIRM & DISPATCH 🚚</Text>}
                </TouchableOpacity>
             </ScrollView>
          </View>
        </View>
      </Modal>

      {/* --- STOCK BATCH SELECTION MODAL --- */}
      <Modal animationType="fade" transparent={true} visible={breedModalVisible} onRequestClose={() => setBreedModalVisible(false)}>
        <View className="flex-1 justify-center items-center bg-black/60 px-5">
            <View className="bg-white w-full max-w-sm rounded-2xl p-4 shadow-xl max-h-[400px]">
                <Text className="text-lg font-bold text-gray-800 mb-4 text-center">Select Stock Batch</Text>
                
                {batches.length === 0 ? (
                    <Text className="text-center text-gray-400 mb-4">No Batches Available. Add Stock in Dashboard first.</Text>
                ) : (
                    <FlatList 
                        data={batches}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({item}) => (
                            <TouchableOpacity 
                                className={`py-3 px-4 mb-2 rounded-xl border ${selectedBatchCode === item.batchCode ? 'bg-orange-50 border-orange-500' : 'bg-white border-gray-100'}`} 
                                onPress={() => { 
                                    setSelectedBatchCode(item.batchCode);
                                    setSelectedBatchId(item.id);
                                    setSelectedBreed(item.breed || 'Unknown');
                                    setBreedModalVisible(false); 
                                }}
                            >
                                <View className="flex-row justify-between items-center">
                                    <View>
                                        <Text className="text-base font-bold text-gray-800">{item.batchCode}</Text>
                                        <Text className="text-xs text-gray-500">{item.breed} • Stock: {item.availableHens}</Text>
                                    </View>
                                    {selectedBatchCode === item.batchCode && <Ionicons name="checkmark-circle" size={20} color="#ea580c" />}
                                </View>
                            </TouchableOpacity>
                        )}
                    />
                )}

                <TouchableOpacity className="mt-4 py-3 bg-gray-100 rounded-xl items-center" onPress={() => setBreedModalVisible(false)}>
                    <Text className="text-gray-500 font-bold">Cancel</Text>
                </TouchableOpacity>
            </View>
        </View>
      </Modal>

    </View>
  );
};

export default Vendors;