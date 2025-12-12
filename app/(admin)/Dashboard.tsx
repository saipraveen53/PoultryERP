import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { rootApi } from '../(utils)/axiosInstance';

// --- CUSTOM BAR CHART ---
const CustomBarChart = ({ data }) => {
  const maxValue = Math.max(...data.map((d) => Math.max(d.debit, d.credit)));
  const steps = 4;
  const stepValue = Math.ceil(maxValue / steps) || 1;
  const maxLabelValue = stepValue * steps;
  const barHeight = 150;

  return (
    <View className="mt-4 flex-row">
      <View className="justify-between items-end pr-2 h-[170px] pb-6">
        {[...Array(steps + 1)].map((_, i) => {
          const value = maxLabelValue - i * stepValue;
          return (
            <Text key={i} className="text-gray-400 text-[10px] font-medium">
              ₹{value}L
            </Text>
          );
        })}
      </View>

      <View className="flex-1">
        <View className="flex-row items-end justify-between px-2 h-[150px] border-b border-l border-gray-200 pb-0">
          {data.map((item, index) => {
            const debitHeight = (item.debit / maxLabelValue) * barHeight;
            const creditHeight = (item.credit / maxLabelValue) * barHeight;

            return (
              <View key={index} className="items-center w-[16%]">
                <View className="flex-row items-end space-x-1">
                  <View style={{ height: debitHeight || 2, width: 6 }} className="bg-red-400 rounded-t-sm" />
                  <View style={{ height: creditHeight || 2, width: 6 }} className="bg-green-500 rounded-t-sm" />
                </View>
              </View>
            );
          })}
        </View>
        <View className="flex-row justify-between px-2 mt-2">
          {data.map((item, index) => (
            <View key={index} className="w-[16%] items-center">
              <Text className="text-gray-400 text-[10px] font-medium">{item.month}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

// --- MAIN DASHBOARD COMPONENT ---
const Dashboard = () => {
  
  // 1. DATA STORE
  const [stockData, setStockData] = useState({
    totalBirds: 0,
    totalWeight: 0,
    availableHens: 0,
  });

  const [rawBatchList, setRawBatchList] = useState([]);

  // Breed Wise Breakdown
  const [breedStats, setBreedStats] = useState({
    "Broiler": { birds: 0, weight: 0 },
    "Natu Kodi (Country Chicken)": { birds: 0, weight: 0 },
    "Juttu Kodi (Crested)": { birds: 0, weight: 0 },
    "Kadaknath": { birds: 0, weight: 0 },
    "Layer": { birds: 0, weight: 0 },
    "Parent Stock": { birds: 0, weight: 0 },
  });

  // 2. FILTER STATE
  const [selectedFilter, setSelectedFilter] = useState("All");

  // 3. FINANCIAL DATA
  const [financials] = useState({
    totalDebit: "₹25.4L",
    totalCredit: "₹18.2L",
    netBalance: "₹7.20L",
  });

  const monthlyData = [
    { month: 'Jan', debit: 45, credit: 40 },
    { month: 'Feb', debit: 60, credit: 55 },
    { month: 'Mar', debit: 30, credit: 20 },
    { month: 'Apr', debit: 80, credit: 75 },
    { month: 'May', debit: 55, credit: 60 },
  ];

  // 4. MODAL & FORM STATES
  const [modalVisible, setModalVisible] = useState(false);
  const [breedModalVisible, setBreedModalVisible] = useState(false);
  
  const [hensCount, setHensCount] = useState("");
  const [totalWeight, setTotalWeight] = useState("");
  const [batchCode, setBatchCode] = useState("");
  const [breed, setBreed] = useState(""); 
  const [loading, setLoading] = useState(false);

  const breedOptions = Object.keys(breedStats);

  // --- API URLS ---
  const GET_STOCK_URL = 'http://192.168.0.110:8081/api/hens/getStock';
  const ADD_STOCK_URL = 'http://192.168.0.110:8081/api/hens/addStock';
  const UPDATE_STOCK_URL = 'http://192.168.0.110:8081/api/hens/updateStock';

  // --- FETCH REALTIME DATA ---
  const fetchDashboardData = async () => {
    try {
      const response = await rootApi.get(GET_STOCK_URL);
      if (response.status === 200 && Array.isArray(response.data)) {
        setRawBatchList(response.data);
        processStockData(response.data);
      }
    } catch (error) {
      console.error("Error fetching stock:", error);
    }
  };

  const processStockData = (data) => {
    let globalBirds = 0;
    let globalWeight = 0;
    let globalAvailable = 0;

    const newBreedStats = {
      "Broiler": { birds: 0, weight: 0 },
      "Natu Kodi (Country Chicken)": { birds: 0, weight: 0 },
      "Juttu Kodi (Crested)": { birds: 0, weight: 0 },
      "Kadaknath": { birds: 0, weight: 0 },
      "Layer": { birds: 0, weight: 0 },
      "Parent Stock": { birds: 0, weight: 0 },
    };

    data.forEach(batch => {
      globalAvailable += (batch.availableHens || 0);
      globalBirds += (batch.totalHens || 0); 
      globalWeight += (batch.weight || 0);

      const apiBreed = batch.breed || "Broiler";
      const matchKey = Object.keys(newBreedStats).find(
        key => key.toLowerCase().includes(apiBreed.toLowerCase())
      ) || apiBreed;

      if (!newBreedStats[matchKey]) {
        newBreedStats[matchKey] = { birds: 0, weight: 0 };
      }

      newBreedStats[matchKey].birds += (batch.availableHens || 0);
      newBreedStats[matchKey].weight += (batch.weight || 0);
    });

    setStockData({
      totalBirds: globalAvailable,
      totalWeight: globalWeight,
      availableHens: globalAvailable
    });
    setBreedStats(newBreedStats);
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [])
  );

  const getDisplayData = () => {
    if (selectedFilter === "All") {
      return { 
        birds: stockData.totalBirds, 
        weight: stockData.totalWeight 
      };
    } else {
      return breedStats[selectedFilter] || { birds: 0, weight: 0 };
    }
  };

  const displayData = getDisplayData();

  // --- SMART ADD / UPDATE STOCK HANDLER ---
  const handleUpdateStock = async () => {
    if (!hensCount || !batchCode || !breed || !totalWeight) {
      Alert.alert("Missing Details", "Please fill all fields including Weight and Breed.");
      return;
    }

    setLoading(true);
    try {
      const existingBatch = rawBatchList.find(b => b.batchCode.toLowerCase() === batchCode.toLowerCase());
      let response;

      if (existingBatch) {
        // --- UPDATE MODE (Use PUT) ---
        const params = {
          id: existingBatch.id,
          hens: parseInt(hensCount),
          weight: parseFloat(totalWeight),
          breed: breed,
          batchCode: batchCode,
        };
        // FIX: Using PUT request for update as per backend @PutMapping
        response = await rootApi.put(UPDATE_STOCK_URL, null, { params: params });
        
      } else {
        // --- ADD MODE (Use POST) ---
        const payload = {
          hens: parseInt(hensCount),
          weight: parseFloat(totalWeight),
          breed: breed,
          batchCode: batchCode,
        };
        response = await rootApi.post(ADD_STOCK_URL, payload);
      }

      if (response.status === 200 || response.status === 201) {
        Alert.alert("Success", existingBatch ? "Stock Updated (Corrected)!" : "New Stock Added!");
        setModalVisible(false);
        
        // Reset Form
        setHensCount("");
        setTotalWeight("");
        setBatchCode("");
        setBreed("");

        // Refresh Data
        fetchDashboardData();
      }
    } catch (error) {
      console.error("Stock Operation Error:", error);
      Alert.alert("Failed", "Operation failed. Check Batch Code or Server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* HEADER */}
        <View className="bg-orange-600 px-6 pt-12 pb-16 rounded-b-[30px] shadow-lg">
          <View>
            <Text className="text-orange-100 text-sm font-medium">Hello Admin,</Text>
            <Text className="text-white text-3xl font-bold">Dashboard</Text>
          </View>

          <TouchableOpacity
            className="mt-6 bg-white flex-row items-center justify-center py-3.5 rounded-xl shadow-md active:opacity-90"
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="add-circle" size={24} color="#ea580c" />
            <Text className="text-orange-600 font-bold ml-2 text-base">Update Daily Stock</Text>
          </TouchableOpacity>
        </View>

        {/* BREED FILTER TABS */}
        <View className="mt-[-25px] pl-5">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-2">
                <TouchableOpacity 
                    onPress={() => setSelectedFilter("All")}
                    className={`mr-3 px-5 py-2 rounded-full border ${selectedFilter === "All" ? 'bg-gray-800 border-gray-800' : 'bg-white border-gray-200'}`}
                >
                    <Text className={`font-bold text-xs ${selectedFilter === "All" ? 'text-white' : 'text-gray-600'}`}>All Breeds</Text>
                </TouchableOpacity>

                {breedOptions.map((item, index) => (
                    <TouchableOpacity 
                        key={index}
                        onPress={() => setSelectedFilter(item)}
                        className={`mr-3 px-4 py-2 rounded-full border ${selectedFilter === item ? 'bg-gray-800 border-gray-800' : 'bg-white border-gray-200'}`}
                    >
                        <Text className={`font-bold text-xs ${selectedFilter === item ? 'text-white' : 'text-gray-600'}`}>
                            {item}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>

        {/* STOCK CARDS */}
        <View className="px-5 mt-4 flex-row justify-between gap-3">
          {/* Birds Card */}
          <View className="bg-white flex-1 p-5 rounded-2xl shadow-sm border-l-4 border-blue-500 elevation-4">
            <View className="flex-row items-center mb-2">
              <View className="bg-blue-100 p-2 rounded-full mr-2">
                <Text className="text-sm">🐔</Text>
              </View>
              <Text className="text-gray-500 font-bold text-xs uppercase tracking-wider">
                {selectedFilter === 'All' ? 'Total Birds' : `${selectedFilter}`}
              </Text>
            </View>
            <Text className="text-3xl font-extrabold text-gray-800">
                {displayData.birds.toLocaleString()}
            </Text>
            <Text className="text-green-600 text-[10px] font-bold mt-1 bg-green-50 self-start px-1 rounded">
              ▲ In Stock
            </Text>
          </View>

          {/* Weight Card */}
          <View className="bg-white flex-1 p-5 rounded-2xl shadow-sm border-l-4 border-purple-500 elevation-4">
            <View className="flex-row items-center mb-2">
              <View className="bg-purple-100 p-2 rounded-full mr-2">
                <Ionicons name="scale-outline" size={16} color="#9333ea" />
              </View>
              <Text className="text-gray-500 font-bold text-xs uppercase tracking-wider">Total Weight</Text>
            </View>
            <Text className="text-3xl font-extrabold text-gray-800">
                {displayData.weight.toLocaleString()} <Text className="text-lg text-gray-500">kg</Text>
            </Text>
            <Text className="text-gray-400 text-[10px] mt-1">
                Avg {(displayData.weight / (displayData.birds || 1)).toFixed(2)} kg/bird
            </Text>
          </View>
        </View>

        {/* FINANCIAL OVERVIEW */}
        <View className="px-5 mt-8">
          <Text className="text-gray-800 font-bold text-lg mb-4">Financial Overview</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row pb-2">
            <View className="bg-red-500 w-36 p-4 rounded-2xl mr-3 shadow-md elevation-3">
              <Text className="text-red-100 text-[10px] font-bold mb-1">DEBIT (SALES)</Text>
              <Text className="text-white text-xl font-bold">{financials.totalDebit}</Text>
              <Ionicons name="trending-up" size={20} color="white" style={{ marginTop: 10, opacity: 0.8 }} />
            </View>
            <View className="bg-teal-600 w-36 p-4 rounded-2xl mr-3 shadow-md elevation-3">
              <Text className="text-teal-100 text-[10px] font-bold mb-1">CREDIT (RCVD)</Text>
              <Text className="text-white text-xl font-bold">{financials.totalCredit}</Text>
              <Ionicons name="trending-down" size={20} color="white" style={{ marginTop: 10, opacity: 0.8 }} />
            </View>
            <View className="bg-orange-500 w-36 p-4 rounded-2xl mr-3 shadow-md elevation-3">
              <Text className="text-orange-100 text-[10px] font-bold mb-1">NET BALANCE</Text>
              <Text className="text-white text-xl font-bold">{financials.netBalance}</Text>
              <Ionicons name="wallet-outline" size={20} color="white" style={{ marginTop: 10, opacity: 0.8 }} />
            </View>
          </ScrollView>
        </View>

        {/* ANALYTICS GRAPH */}
        <View className="px-5 mt-6">
          <View className="flex-row justify-between items-end mb-2">
             <Text className="text-gray-800 font-bold text-lg">Monthly Analytics</Text>
             <View className="flex-row space-x-3">
                <View className="flex-row items-center">
                    <View className="w-2 h-2 bg-red-400 rounded-full mr-1"/>
                    <Text className="text-[10px] text-gray-500">Sales</Text>
                </View>
                <View className="flex-row items-center">
                    <View className="w-2 h-2 bg-green-500 rounded-full mr-1"/>
                    <Text className="text-[10px] text-gray-500">Rcvd</Text>
                </View>
             </View>
          </View>
          <View className="bg-white p-4 rounded-2xl shadow-sm elevation-1 border border-gray-100">
            <CustomBarChart data={monthlyData} />
          </View>
        </View>
      </ScrollView>

      {/* --- 1. UPDATE STOCK MODAL --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 h-[75%] shadow-2xl">
            
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-gray-800">Update Stock 🐔</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} className="bg-gray-100 p-2 rounded-full">
                <Ionicons name="close" size={20} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView className="space-y-4" showsVerticalScrollIndicator={false}>
              
              {/* Batch Code */}
              <View>
                <Text className="text-gray-500 text-xs font-bold mb-1 ml-1">BATCH CODE</Text>
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 font-medium"
                  placeholder="e.g. JC001"
                  value={batchCode}
                  onChangeText={setBatchCode}
                />
              </View>

              {/* Hens Quantity */}
              <View>
                <Text className="text-gray-500 text-xs font-bold mb-1 ml-1">HENS QUANTITY</Text>
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 font-medium"
                  placeholder="e.g. 200"
                  keyboardType="numeric"
                  value={hensCount}
                  onChangeText={setHensCount}
                />
              </View>

              {/* NEW: Weight Input */}
              <View>
                <Text className="text-gray-500 text-xs font-bold mb-1 ml-1">TOTAL WEIGHT (KG)</Text>
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 font-medium"
                  placeholder="e.g. 450.5"
                  keyboardType="numeric"
                  value={totalWeight}
                  onChangeText={setTotalWeight}
                />
              </View>

              {/* Breed Selection */}
              <View>
                <Text className="text-gray-500 text-xs font-bold mb-1 ml-1">BREED TYPE</Text>
                <TouchableOpacity 
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex-row justify-between items-center"
                    onPress={() => setBreedModalVisible(true)}
                >
                    <Text className={`font-medium ${breed ? 'text-gray-800' : 'text-gray-400'}`}>
                        {breed || "Select Breed"}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#9ca3af" />
                </TouchableOpacity>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                className={`mt-6 py-4 rounded-xl shadow-lg flex-row justify-center items-center ${loading ? 'bg-orange-400' : 'bg-orange-600'}`}
                onPress={handleUpdateStock}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text className="text-white font-bold text-lg mr-2">UPDATE NOW</Text>
                    <Ionicons name="checkmark-circle" size={22} color="#fff" />
                  </>
                )}
              </TouchableOpacity>
              
              {/* Bottom Padding for scroll */}
              <View className="h-20" /> 
            </ScrollView>

          </View>
        </View>
      </Modal>

      {/* --- 2. BREED SELECTION MODAL --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={breedModalVisible}
        onRequestClose={() => setBreedModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/60 px-5">
            <View className="bg-white w-full max-w-sm rounded-2xl p-4 shadow-xl">
                <Text className="text-lg font-bold text-gray-800 mb-4 text-center">Select Hen Breed</Text>
                
                {breedOptions.map((item, index) => (
                    <TouchableOpacity 
                        key={index} 
                        className={`py-3 px-4 mb-2 rounded-xl border ${breed === item ? 'bg-orange-50 border-orange-500' : 'bg-white border-gray-100'}`}
                        onPress={() => {
                            setBreed(item);
                            setBreedModalVisible(false);
                        }}
                    >
                        <View className="flex-row justify-between items-center">
                            <Text className={`text-base ${breed === item ? 'text-orange-700 font-bold' : 'text-gray-700'}`}>
                                {item}
                            </Text>
                            {breed === item && <Ionicons name="checkmark-circle" size={20} color="#ea580c" />}
                        </View>
                    </TouchableOpacity>
                ))}

                <TouchableOpacity 
                    className="mt-2 py-3 bg-gray-100 rounded-xl items-center"
                    onPress={() => setBreedModalVisible(false)}
                >
                    <Text className="text-gray-500 font-bold">Cancel</Text>
                </TouchableOpacity>
            </View>
        </View>
      </Modal>

    </View>
  );
};

export default Dashboard;