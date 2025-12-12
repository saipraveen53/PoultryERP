import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

// --- INTERFACES ---
interface Transaction {
  id: string;
  date: string;
  particular: string; // Description or Vendor Name
  refNo?: string;     // Invoice or DC No
  type: 'DEBIT' | 'CREDIT'; // DEBIT = Sale (Red), CREDIT = Payment (Green)
  amount: string;
  
  // Sale Specific Fields (Optional)
  vehicleNo?: string;
  birds?: string;
  weight?: string;
  rate?: string;
}

const Transactions = () => {
  // 1. MOCK DATA (Static for now)
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: '1', date: '01/08/2025', particular: 'CG-C.Growing Sales GST-TS', refNo: '25/WNPBS1625',
      type: 'DEBIT', amount: '145730.00', vehicleNo: 'TS32T8889', birds: '900', weight: '1996.3', rate: '73.00'
    },
    {
      id: '2', date: '06/08/2025', particular: 'Andhra Bank C/a (Shekarreddy)',
      type: 'CREDIT', amount: '1998000.00'
    },
    {
      id: '3', date: '02/08/2025', particular: 'CG-C.Growing Sales GST-TS', refNo: '25/GDLBS905',
      type: 'DEBIT', amount: '182172.00', vehicleNo: 'AP39WD2002', birds: '1022', weight: '2495.5', rate: '73.00'
    },
  ]);

  // 2. STATE MANAGEMENT
  const [modalVisible, setModalVisible] = useState(false);
  const [transType, setTransType] = useState<'DEBIT' | 'CREDIT'>('DEBIT');
  
  // Form State
  const [date, setDate] = useState('2025-12-12');
  const [particular, setParticular] = useState('');
  const [amount, setAmount] = useState('');
  const [refNo, setRefNo] = useState('');
  
  // Sale Specific Form State
  const [vehicleNo, setVehicleNo] = useState('');
  const [birds, setBirds] = useState('');
  const [weight, setWeight] = useState('');
  const [rate, setRate] = useState('');

  // --- ACTIONS ---
  const handleAddTransaction = () => {
    if (!particular || !amount || !date) {
      Alert.alert("Missing Details", "Please fill Date, Particulars, and Amount.");
      return;
    }

    const newTrans: Transaction = {
      id: Math.random().toString(),
      date,
      particular,
      refNo,
      type: transType,
      amount,
      vehicleNo: transType === 'DEBIT' ? vehicleNo : undefined,
      birds: transType === 'DEBIT' ? birds : undefined,
      weight: transType === 'DEBIT' ? weight : undefined,
      rate: transType === 'DEBIT' ? rate : undefined,
    };

    setTransactions([newTrans, ...transactions]);
    setModalVisible(false);
    resetForm();
  };

  const resetForm = () => {
    setParticular(''); setAmount(''); setRefNo('');
    setVehicleNo(''); setBirds(''); setWeight(''); setRate('');
    setTransType('DEBIT');
  };

  // Auto-Calculate Amount for Sales
  const calculateAmount = (w: string, r: string) => {
    const wt = parseFloat(w) || 0;
    const rt = parseFloat(r) || 0;
    if (wt > 0 && rt > 0) {
      setAmount((wt * rt).toFixed(2));
    }
  };

  // --- RENDER CARD ---
  const renderItem = ({ item }: { item: Transaction }) => (
    <View style={styles.card}>
      {/* Header Row */}
      <View style={styles.cardHeader}>
        <View style={{flex: 1}}>
            <Text style={styles.dateText}>📅 {item.date}</Text>
            <Text style={styles.particularText}>{item.particular}</Text>
            {item.refNo ? <Text style={styles.refText}>Ref: {item.refNo}</Text> : null}
        </View>
        <View style={{alignItems: 'flex-end'}}>
            <Text style={[
                styles.amountText, 
                item.type === 'DEBIT' ? styles.textDebit : styles.textCredit
            ]}>
                {item.type === 'DEBIT' ? '-' : '+'} ₹{item.amount}
            </Text>
            <View style={[
                styles.badge, 
                item.type === 'DEBIT' ? styles.badgeDebit : styles.badgeCredit
            ]}>
                <Text style={[
                    styles.badgeText,
                    item.type === 'DEBIT' ? styles.textDebit : styles.textCredit
                ]}>{item.type}</Text>
            </View>
        </View>
      </View>

      {/* Sale Details (Only for DEBIT) */}
      {item.type === 'DEBIT' && (
        <>
            <View style={styles.divider} />
            <View style={styles.detailsRow}>
                {item.vehicleNo && (
                    <View style={styles.detailBox}>
                        <Text style={styles.detailLabel}>Vehicle</Text>
                        <Text style={styles.detailValue}>{item.vehicleNo}</Text>
                    </View>
                )}
                <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>Birds</Text>
                    <Text style={styles.detailValue}>{item.birds || '-'}</Text>
                </View>
                <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>Weight</Text>
                    <Text style={styles.detailValue}>{item.weight || '-'} kg</Text>
                </View>
                <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>Rate</Text>
                    <Text style={styles.detailValue}>₹{item.rate || '-'}</Text>
                </View>
            </View>
        </>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
            <View>
                <Text style={styles.headerSub}>Accounts</Text>
                <Text style={styles.headerTitle}>Transactions</Text>
            </View>
            <TouchableOpacity 
                style={styles.addButton}
                onPress={() => setModalVisible(true)}
            >
                <Ionicons name="add" size={26} color="#ea580c" />
            </TouchableOpacity>
        </View>
      </View>

      {/* LIST */}
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
            <View style={styles.center}>
                <Text style={styles.emptyText}>No Transactions Found</Text>
            </View>
        }
      />

      {/* --- ADD TRANSACTION MODAL --- */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Entry 📒</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Type Switcher */}
                <View style={styles.switchContainer}>
                    <TouchableOpacity 
                        style={[styles.switchBtn, transType === 'DEBIT' && styles.switchActiveDebit]}
                        onPress={() => setTransType('DEBIT')}
                    >
                        <Text style={[styles.switchText, transType === 'DEBIT' && styles.switchTextActive]}>Sale (Debit)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.switchBtn, transType === 'CREDIT' && styles.switchActiveCredit]}
                        onPress={() => setTransType('CREDIT')}
                    >
                        <Text style={[styles.switchText, transType === 'CREDIT' && styles.switchTextActive]}>Receipt (Credit)</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.inputLabel}>DATE (DD/MM/YYYY)</Text>
                <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="2025-12-12" />

                <Text style={styles.inputLabel}>PARTICULAR / DESCRIPTION</Text>
                <TextInput style={styles.input} value={particular} onChangeText={setParticular} placeholder={transType === 'DEBIT' ? "e.g. Sales GST-TS" : "e.g. Bank Deposit"} />

                {transType === 'DEBIT' ? (
                    <>
                        <Text style={styles.inputLabel}>REF / INVOICE NO</Text>
                        <TextInput style={styles.input} value={refNo} onChangeText={setRefNo} placeholder="e.g. 25/WNPBS..." />

                        <Text style={styles.inputLabel}>VEHICLE NO</Text>
                        <TextInput style={styles.input} value={vehicleNo} onChangeText={setVehicleNo} placeholder="e.g. TS07..." />

                        <View style={styles.row}>
                            <View style={{flex: 1, marginRight: 8}}>
                                <Text style={styles.inputLabel}>BIRDS</Text>
                                <TextInput style={styles.input} keyboardType="numeric" value={birds} onChangeText={setBirds} placeholder="0" />
                            </View>
                            <View style={{flex: 1}}>
                                <Text style={styles.inputLabel}>WEIGHT</Text>
                                <TextInput style={styles.input} keyboardType="numeric" value={weight} 
                                    onChangeText={(t) => { setWeight(t); calculateAmount(t, rate); }} placeholder="0.0" 
                                />
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={{flex: 1, marginRight: 8}}>
                                <Text style={styles.inputLabel}>RATE</Text>
                                <TextInput style={styles.input} keyboardType="numeric" value={rate} 
                                    onChangeText={(t) => { setRate(t); calculateAmount(weight, t); }} placeholder="0.0" 
                                />
                            </View>
                            <View style={{flex: 1}}>
                                <Text style={styles.inputLabel}>AMOUNT</Text>
                                <View style={styles.readOnlyBox}>
                                    <Text style={styles.readOnlyText}>{amount || '0'}</Text>
                                </View>
                            </View>
                        </View>
                    </>
                ) : (
                    <>
                        <Text style={styles.inputLabel}>AMOUNT RECEIVED (₹)</Text>
                        <TextInput style={[styles.input, {fontSize: 18, fontWeight: 'bold'}]} keyboardType="numeric" value={amount} onChangeText={setAmount} placeholder="0.00" />
                    </>
                )}

                <TouchableOpacity 
                    style={[styles.submitBtn, transType === 'CREDIT' ? {backgroundColor: '#16a34a'} : {backgroundColor: '#ea580c'}]} 
                    onPress={handleAddTransaction}
                >
                    <Text style={styles.submitBtnText}>SAVE ENTRY</Text>
                </TouchableOpacity>
                
                <View style={{height: 20}} />
            </ScrollView>
          </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  emptyText: { color: 'gray', fontSize: 16 },

  // Header
  header: { backgroundColor: '#ea580c', paddingTop: 40, paddingBottom: 20, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, marginBottom: 15, elevation: 5 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerSub: { color: '#ffedd5', fontSize: 14, fontWeight: '500' },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  addButton: { backgroundColor: '#fff', padding: 10, borderRadius: 25, elevation: 3 },

  // Card
  card: { backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 15, padding: 15, borderRadius: 16, elevation: 2, borderWidth: 1, borderColor: '#F3F4F6' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  
  dateText: { fontSize: 12, color: '#6B7280', fontWeight: 'bold', marginBottom: 4 },
  particularText: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 2 },
  refText: { fontSize: 12, color: '#9CA3AF' },

  amountText: { fontSize: 18, fontWeight: 'bold' },
  textDebit: { color: '#DC2626' },   // Red
  textCredit: { color: '#16a34a' },  // Green

  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginTop: 4, alignSelf: 'flex-end' },
  badgeDebit: { backgroundColor: '#FEE2E2' },
  badgeCredit: { backgroundColor: '#DCFCE7' },
  badgeText: { fontSize: 10, fontWeight: 'bold' },

  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },

  detailsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detailBox: { alignItems: 'center' },
  detailLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: 'bold', textTransform: 'uppercase' },
  detailValue: { fontSize: 13, fontWeight: '600', color: '#374151' },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  closeBtn: { backgroundColor: '#F3F4F6', padding: 8, borderRadius: 20 },

  switchContainer: { flexDirection: 'row', backgroundColor: '#F3F4F6', padding: 4, borderRadius: 12, marginBottom: 20 },
  switchBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  switchActiveDebit: { backgroundColor: '#fff', elevation: 2, borderLeftWidth: 4, borderLeftColor: '#DC2626' },
  switchActiveCredit: { backgroundColor: '#fff', elevation: 2, borderLeftWidth: 4, borderLeftColor: '#16a34a' },
  switchText: { fontWeight: 'bold', color: '#6B7280' },
  switchTextActive: { color: '#1F2937' },

  inputLabel: { fontSize: 12, fontWeight: 'bold', color: '#6B7280', marginBottom: 6, marginLeft: 2 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, marginBottom: 15, fontSize: 14, color: '#1F2937' },
  
  row: { flexDirection: 'row' },
  readOnlyBox: { backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, justifyContent: 'center' },
  readOnlyText: { fontWeight: 'bold', color: '#374151', fontSize: 16 },

  submitBtn: { paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

export default Transactions;