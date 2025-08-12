import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const List = ({ item, onPress }) => {
  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={() => onPress(item)}
    >
      <View style={styles.infoContainer}>
        <Text style={styles.numberText}>
          ประวัติการซ่อมที่ {item.id}
        </Text>
        <Text style={styles.detailText}>
          ID: {item.id} • {item.date}
        </Text>
        <Text style={styles.detailText}>
          {item.brand} {item.model} • {item.symptom}
        </Text>
      </View>

      <View style={[
        styles.statusContainer,
        item.status === 'กำลังซ่อม' ? styles.repairing : styles.completed
      ]}>
        <Text style={styles.statusText}>{item.status}</Text>
        <Ionicons 
          name="chevron-forward" 
          size={20} 
          color={item.status === 'กำลังซ่อม' ? '#FFF' : '#228B22'} 
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
  },
  infoContainer: {
    flex: 1,
  },
  numberText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginVertical: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 15,
    marginLeft: 10,
  },
  repairing: {
    backgroundColor: '#FF6600',
  },
  completed: {
    backgroundColor: '#90EE90',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 5,
    color: '#333',
  },
});

export default List;