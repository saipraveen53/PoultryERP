import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { JSX, useMemo, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Types
type Breed = { id: string; name: string; hint?: string; color?: string };
type BreedReport = { id: string; quantity: string }; // no per-breed 'paid' now

const HEN_BREEDS: Breed[] = [
  { id: "leghorn", name: "Leghorn", hint: "White eggs", color: "#FEF3C7" },
  { id: "rhode", name: "Rhode Island", hint: "Hardy", color: "#FEE2E2" },
  { id: "sussex", name: "Sussex", hint: "Friendly", color: "#E0E7FF" },
  { id: "plymouth", name: "Plymouth Rock", hint: "Cold Hardy", color: "#DCFCE7" },
  { id: "wyandotte", name: "Wyandotte", hint: "Attractive plumage", color: "#F3E8FF" },
  { id: "amberlink", name: "Amberlink", hint: "Commercial layer", color: "#FFEDD5" },
];

export default function Report(): JSX.Element {
  const router = useRouter();
  const { width } = Dimensions.get("window");
  const isWide = width > 768;

  // Form state
  const [farmName, setFarmName] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [reporterPhone, setReporterPhone] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  // Combined payment status for the whole report (new)
  const [paymentCollected, setPaymentCollected] = useState<boolean>(false);

  // breeds -> quantity only
  const [breeds, setBreeds] = useState<Record<string, BreedReport>>(
    () =>
      Object.fromEntries(
        HEN_BREEDS.map((b) => [b.id, { id: b.id, quantity: "0" }])
      ) as Record<string, BreedReport>
  );

  // images
  const [images, setImages] = useState<string[]>([]);

  // errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // summary values
  const summary = useMemo(() => {
    const lines = Object.values(breeds).map((b) => ({
      id: b.id,
      qty: Math.max(0, parseInt(b.quantity || "0", 10) || 0),
    }));
    const totalQty = lines.reduce((s, l) => s + l.qty, 0);
    const activeLines = lines.filter((l) => l.qty > 0);
    return { lines: activeLines, totalQty };
  }, [breeds]);

  // Image picker (single at a time; repeat to add multiple)
  async function pickImage() {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission required", "Please allow access to photos to upload images.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsEditing: true,
      });

      // expo-image-picker returns different shapes on SDKs; handle both
      // @ts-ignore
      const uri = result?.uri ?? result?.assets?.[0]?.uri;
      if (uri) {
        setImages((prev) => [uri, ...prev].slice(0, 6)); // limit to 6 images
      }
    } catch (e) {
      console.error("Image pick error", e);
      Alert.alert("Image error", "Could not pick image.");
    }
  }

  function removeImage(uri: string) {
    setImages((prev) => prev.filter((u) => u !== uri));
  }

  function updateBreedQty(id: string, qty: string) {
    setBreeds((prev) => ({ ...prev, [id]: { ...prev[id], quantity: qty } }));
    setErrors((s) => ({ ...s, breeds: "" }));
  }

  function validate(): boolean {
    const err: Record<string, string> = {};
    if (!farmName.trim()) err.farmName = "Enter farm name.";
    if (!reporterName.trim()) err.reporterName = "Enter your name.";
    if (!reporterPhone.trim()) err.reporterPhone = "Enter contact phone.";
    if (!location.trim()) err.location = "Enter location/address.";

    const activeQty = Object.values(breeds).some((b) => (parseInt(b.quantity || "0", 10) || 0) > 0);
    if (!activeQty) err.breeds = "Add quantity for at least one breed.";

    setErrors(err);
    if (Object.keys(err).length > 0) {
      // show a main alert too
      Alert.alert("Missing information", "Please fix the highlighted fields before sending the report.");
      return false;
    }
    return true;
  }

  async function submitReport() {
    if (!validate()) return;

    const report = {
      id: `RPT-${Date.now()}`,
      farmName,
      reporterName,
      reporterPhone,
      location,
      notes,
      paymentCollected, // include combined payment status
      breeds: Object.values(breeds).map((b) => ({ id: b.id, qty: parseInt(b.quantity || "0", 10) || 0 })),
      images,
      createdAt: new Date().toISOString(),
    };

    try {
      const raw = await AsyncStorage.getItem("reports");
      const list = raw ? JSON.parse(raw) : [];
      list.unshift(report);
      await AsyncStorage.setItem("reports", JSON.stringify(list));

      // success feedback
      Alert.alert("Report Sent", "Your report has been sent to the Admin.");
      // reset form (optional)
      setFarmName("");
      setReporterName("");
      setReporterPhone("");
      setLocation("");
      setNotes("");
      setPaymentCollected(false);
      setBreeds(
        Object.fromEntries(HEN_BREEDS.map((b) => [b.id, { id: b.id, quantity: "0" }])) as Record<
          string,
          BreedReport
        >
      );
      setImages([]);
      setErrors({});
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to send report. Try again.");
    }
  }

  // quick helpers
  function selectAllBreeds() {
    setBreeds((prev) =>
      Object.fromEntries(
        HEN_BREEDS.map((b) => [b.id, { id: b.id, quantity: "10" }])
      ) as Record<string, BreedReport>
    );
  }
  function clearBreeds() {
    setBreeds(
      Object.fromEntries(HEN_BREEDS.map((b) => [b.id, { id: b.id, quantity: "0" }])) as Record<
        string,
        BreedReport
      >
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>
        {/* Header - Changed from emerald-900 to orange-600 */}
        <View className="px-4 pt-6 pb-4 bg-orange-600">
          <View className="flex-row justify-between items-start">
            <View>
              {/* Changed text-emerald-100 to text-orange-100 */}
              <Text className="text-orange-100 text-xs uppercase tracking-widest">Vendor</Text>
              <Text className="text-white text-2xl font-bold">Send Report to Admin</Text>
              {/* Changed text-emerald-200 to text-orange-100 */}
              <Text className="text-orange-100 text-sm mt-1">Report stock, payments, defects with images</Text>
            </View>
            {/* Changed bg-emerald-800 to bg-orange-700 */}
            <TouchableOpacity onPress={() => router.back()} className="bg-orange-700 px-3 py-2 rounded-full">
              <Feather name="arrow-left" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View className={`px-4 pt-6 ${isWide ? "max-w-6xl mx-auto flex-row gap-6" : "flex-col gap-6"}`}>
          {/* LEFT: Form */}
          <View className={isWide ? "flex-[2]" : "w-full"}>
            {/* Identity */}
            <View className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-4">
              <Text className="text-base font-bold text-slate-800 mb-3">Report Details</Text>

              <Text className="text-xs text-slate-500">Farm / Company</Text>
              <TextInput
                value={farmName}
                onChangeText={(t) => {
                  setFarmName(t);
                  setErrors((s) => ({ ...s, farmName: "" }));
                }}
                placeholder="Farm name"
                className={`mt-1 mb-3 p-3 rounded-xl ${errors.farmName ? "border border-red-400 bg-red-50" : "border border-slate-200 bg-slate-50"}`}
              />
              {errors.farmName ? <Text className="text-red-500 text-xs mb-2">{errors.farmName}</Text> : null}

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-xs text-slate-500">Reporter</Text>
                  <TextInput
                    value={reporterName}
                    onChangeText={(t) => {
                      setReporterName(t);
                      setErrors((s) => ({ ...s, reporterName: "" }));
                    }}
                    placeholder="Your name"
                    className={`mt-1 mb-3 p-3 rounded-xl ${errors.reporterName ? "border border-red-400 bg-red-50" : "border border-slate-200 bg-slate-50"}`}
                  />
                  {errors.reporterName ? <Text className="text-red-500 text-xs mb-2">{errors.reporterName}</Text> : null}
                </View>

                <View className="w-36">
                  <Text className="text-xs text-slate-500">Phone</Text>
                  <TextInput
                    value={reporterPhone}
                    onChangeText={(t) => {
                      setReporterPhone(t);
                      setErrors((s) => ({ ...s, reporterPhone: "" }));
                    }}
                    placeholder="+1 555 5555"
                    keyboardType="phone-pad"
                    className={`mt-1 mb-3 p-3 rounded-xl ${errors.reporterPhone ? "border border-red-400 bg-red-50" : "border border-slate-200 bg-slate-50"}`}
                  />
                  {errors.reporterPhone ? <Text className="text-red-500 text-xs mb-2">{errors.reporterPhone}</Text> : null}
                </View>
              </View>

              <Text className="text-xs text-slate-500">Location / Address</Text>
              <TextInput
                value={location}
                onChangeText={(t) => {
                  setLocation(t);
                  setErrors((s) => ({ ...s, location: "" }));
                }}
                placeholder="Where this stock is located"
                className={`mt-1 mb-3 p-3 rounded-xl ${errors.location ? "border border-red-400 bg-red-50" : "border border-slate-200 bg-slate-50"}`}
              />
              {errors.location ? <Text className="text-red-500 text-xs mb-2">{errors.location}</Text> : null}
            </View>

            {/* Breeds grid */}
            <View className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-4">
              <Text className="text-base font-bold text-slate-800 mb-3">Breeds Summary</Text>
              <Text className="text-xs text-slate-500 mb-3">Add quantities for each breed. Use the Payment section below to indicate if payment was collected for this report.</Text>

              <View className="flex-row justify-between mb-3">
                <TouchableOpacity onPress={selectAllBreeds} className="px-3 py-2 bg-slate-100 rounded-xl">
                  <Text className="text-slate-700">Select defaults</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={clearBreeds} className="px-3 py-2 bg-slate-100 rounded-xl">
                  <Text className="text-slate-700">Clear</Text>
                </TouchableOpacity>
              </View>

              <View className="flex-row flex-wrap gap-3">
                {HEN_BREEDS.map((b) => {
                  const br = breeds[b.id];
                  const qtyErr = errors[`qty_${b.id}`];
                  return (
                    <View key={b.id} style={{ backgroundColor: b.color || "#fff" }} className="w-full rounded-xl p-3 border border-slate-100">
                      <View className="flex-row justify-between items-start">
                        <View>
                          <Text className="font-bold text-slate-800">{b.name}</Text>
                          <Text className="text-xs text-slate-500">{b.hint}</Text>
                        </View>
                      </View>

                      <View className="flex-row items-center gap-3 mt-3">
                        <View className="flex-1">
                          <Text className="text-xs text-slate-500">Quantity</Text>
                          <TextInput
                            value={br.quantity}
                            onChangeText={(t) => {
                              updateBreedQty(b.id, t.replace(/[^0-9]/g, ""));
                              setErrors((s) => ({ ...s, [`qty_${b.id}`]: "" }));
                            }}
                            keyboardType="numeric"
                            placeholder="0"
                            className={`mt-1 p-3 rounded-xl ${qtyErr ? "border border-red-400 bg-red-50" : "border border-slate-200 bg-white"}`}
                          />
                          {qtyErr ? <Text className="text-red-500 text-xs mt-1">{qtyErr}</Text> : null}
                        </View>

                        <View className="w-24 items-center">
                          <Text className="text-xs text-slate-500 mb-1">Preview</Text>
                          <Text className="font-bold text-slate-800">{Math.max(0, parseInt(br.quantity || "0", 10) || 0)}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>

              {errors.breeds ? <Text className="text-red-500 text-sm mt-3">{errors.breeds}</Text> : null}

              {/* Combined Payment Status for entire report */}
              <View className="mt-4 border-t border-slate-100 pt-4">
                <Text className="text-sm font-semibold text-slate-700 mb-2">Payment Status</Text>
                <Text className="text-xs text-slate-500 mb-2">Indicate whether payment was collected for this report (all breeds combined).</Text>
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => setPaymentCollected(true)}
                    // Changed bg-emerald-600 to bg-orange-600
                    className={`px-4 py-2 rounded-xl ${paymentCollected ? "bg-orange-600" : "bg-slate-100"}`}
                  >
                    <Text className={`${paymentCollected ? "text-white" : "text-slate-700"} font-semibold`}>Collected</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setPaymentCollected(false)}
                    className={`px-4 py-2 rounded-xl ${!paymentCollected ? "bg-red-100 border border-red-200" : "bg-slate-100"}`}
                  >
                    <Text className={`${!paymentCollected ? "text-red-700" : "text-slate-700"} font-semibold`}>Pending</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Images */}
            <View className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-4">
              <Text className="text-base font-bold text-slate-800 mb-3">Defect Images (optional)</Text>
              <Text className="text-xs text-slate-500 mb-3">Upload photos showing defects or issues. Max 6 images.</Text>

              <View className="flex-row gap-3 mb-3">
                <TouchableOpacity onPress={pickImage} className="px-4 py-3 bg-slate-100 rounded-xl">
                  <Feather name="camera" size={18} color="#334155" />
                  <Text className="text-slate-700 ml-2">Upload Image</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setImages([]);
                  }}
                  className="px-4 py-3 bg-slate-100 rounded-xl"
                >
                  <Text className="text-slate-700">Clear Images</Text>
                </TouchableOpacity>
              </View>

              <View className="flex-row flex-wrap gap-3">
                {images.length === 0 ? (
                  <Text className="text-xs text-slate-400">No images uploaded.</Text>
                ) : (
                  images.map((uri) => (
                    <View key={uri} className="w-28 h-20 rounded overflow-hidden border border-slate-100">
                      <Image source={{ uri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                      <TouchableOpacity onPress={() => removeImage(uri)} className="absolute top-1 right-1 bg-black/60 rounded-full p-1">
                        <Feather name="x" size={12} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>
            </View>

            {/* Notes & Submit */}
            <View className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-8">
              <Text className="text-base font-bold text-slate-800 mb-3">Additional Notes</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Any other comments..."
                multiline
                numberOfLines={3}
                className="bg-slate-50 border p-3 rounded-xl mb-4 border-slate-200"
              />

              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="text-xs text-slate-500">Total birds reported</Text>
                  <Text className="text-lg font-bold text-slate-900">{summary.totalQty}</Text>
                </View>

                <View className="flex-row gap-3">
                  <TouchableOpacity onPress={() => { /* preview action optional */ Alert.alert("Preview", "Previewing report"); }} className="px-4 py-3 bg-slate-100 rounded-xl">
                    <Text className="text-slate-700 font-semibold">Preview</Text>
                  </TouchableOpacity>

                  {/* Changed bg-emerald-600 to bg-orange-600 */}
                  <TouchableOpacity onPress={submitReport} className="px-4 py-3 bg-orange-600 rounded-xl">
                    <Text className="text-white font-semibold">Send Report</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* RIGHT: Summary / Sidebar */}
          <View className={isWide ? "flex-[1]" : "w-full"}>
            <Text className="text-slate-500 font-bold mb-3 uppercase tracking-wider text-xs">Live Summary</Text>

            <View className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-4">
              <Text className="text-sm text-slate-500">Active breed lines</Text>
              <Text className="text-xl font-bold text-slate-900 mb-2">{summary.lines.length}</Text>

              <View className="border-t border-slate-100 pt-3">
                {summary.lines.length === 0 ? (
                  <Text className="text-sm text-slate-500">No breeds added yet.</Text>
                ) : (
                  summary.lines.map((l) => (
                    <View key={l.id} className="flex-row justify-between py-2 border-b border-slate-100">
                      <Text className="text-sm text-slate-700">{HEN_BREEDS.find((b) => b.id === l.id)?.name}</Text>
                      <Text className="font-semibold text-slate-900">{l.qty}</Text>
                    </View>
                  ))
                )}
              </View>
            </View>

            <View className="bg-white p-4 rounded-2xl border border-slate-100 mb-4">
              <Text className="text-sm text-slate-500 mb-2">Payment status for report</Text>
              <Text className="text-lg font-bold text-slate-900">{paymentCollected ? "Collected" : "Pending"}</Text>
            </View>

            <View className="bg-white p-4 rounded-2xl border border-slate-100">
              <Text className="text-sm text-slate-500 mb-2">Images uploaded</Text>
              <Text className="text-lg font-bold text-slate-900">{images.length}</Text>

              <View className="mt-4">
                <Text className="text-xs text-slate-500">Last saved reports</Text>
                <TouchableOpacity onPress={async () => {
                  const raw = await AsyncStorage.getItem("reports");
                  const list = raw ? JSON.parse(raw) : [];
                  Alert.alert("Saved Reports", `You have ${list.length} saved report(s) locally.`);
                }} className="mt-2 px-3 py-2 bg-slate-100 rounded">
                  <Text className="text-slate-700">Show count</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}