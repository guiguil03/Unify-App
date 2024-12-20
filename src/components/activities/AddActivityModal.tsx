import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Modal } from "../common/Modal";

interface AddActivityModalProps {
  visible: boolean;
  onClose: () => void;
  onStartLiveActivity: () => void;
  onAddManualActivity: (activity: {
    distance: number;
    duration: string;
    date: string;
  }) => void;
}

export function AddActivityModal({
  visible,
  onClose,
  onStartLiveActivity,
  onAddManualActivity,
}: AddActivityModalProps) {
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [date, setDate] = useState("");

  const handleManualSubmit = () => {
    if (distance && duration && date) {
      onAddManualActivity({
        distance: parseFloat(distance),
        duration,
        date,
      });
      resetForm();
      onClose();
    }
  };

  const resetForm = () => {
    setDistance("");
    setDuration("");
    setDate("");
  };

  return (
    <Modal visible={visible} onClose={onClose}>
      <Text style={styles.title}>Ajouter une activité</Text>

      <TouchableOpacity
        style={styles.liveButton}
        onPress={() => {
          onClose();
          onStartLiveActivity();
        }}
      >
        <MaterialCommunityIcons name="run" size={24} color="white" />
        <Text style={styles.buttonText}>Démarrer une course</Text>
      </TouchableOpacity>

      <View style={styles.separator}>
        <View style={styles.line} />
        <Text style={styles.separatorText}>ou</Text>
        <View style={styles.line} />
      </View>

      <Text style={styles.subtitle}>Ajouter une activité passée</Text>

      <TextInput
        style={styles.input}
        placeholder="Distance (km)"
        value={distance}
        onChangeText={setDistance}
        keyboardType="decimal-pad"
      />

      <TextInput
        style={styles.input}
        placeholder="Durée (ex: 30:00)"
        value={duration}
        onChangeText={setDuration}
      />

      <TextInput
        style={styles.input}
        placeholder="Date (ex: 21 Mars 2024)"
        value={date}
        onChangeText={setDate}
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={onClose}
        >
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.submitButton]}
          onPress={handleManualSubmit}
        >
          <Text style={styles.buttonText}>Ajouter</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    marginTop: 12,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  liveButton: {
    backgroundColor: "#E83D4D",
    padding: 16,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  separator: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#e0e0e0",
  },
  separatorText: {
    marginHorizontal: 10,
    color: "#666",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButton: {
    backgroundColor: "#E83D4D",
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
  },
  cancelButtonText: {
    color: "#666",
    fontWeight: "600",
  },
});
