import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Button from "@/components/button";
import { useEffect } from "react";
import { router } from "expo-router";

export default function Dashboard() {
  return (
    <ScrollView style={styles.container}
      contentContainerStyle={{ paddingBottom: 20 }}>
      {/* HEADER */}
      {/* HEADER */}
      {/* ISLAND HEADER */}
      <View style={styles.islandWrapper}>
        <LinearGradient
          colors={["#5f00be", "#00A693"]} // ✅ updated
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.islandCard}
        >
          {/* TOP BAR */}
          <View style={styles.topBar}>
            <View style={styles.profileSection}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>A</Text>
              </View>
              <View style={styles.welcomeTextGroup}>
                <Text style={styles.helloText}>Hello, Aman 👋</Text>
                <Text style={styles.dateLabel}>Tuesday, 14 April</Text>
              </View>
            </View>

            <View style={styles.rightIcons}>
              <TouchableOpacity style={styles.glassIcon}>
                <Ionicons name="notifications-outline" size={20} color="#fff" />
                <View style={styles.activeDot} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.glassIcon}>
                <Ionicons name="settings-outline" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* QUICK STATS / SUBTITLE */}
          <View style={styles.headerFooter}>
            <Text style={styles.motivationText}>
              You have <Text style={{ fontWeight: "bold" }}>5 tasks</Text> to
              complete today!
            </Text>
          </View>
        </LinearGradient>
      </View>

      {/* Background Decorative Element
        <View style={styles.headerCircle} />
      </LinearGradient> */}

      {/* CARDS */}
      <View style={styles.cardRow}>
        <View style={styles.card}>
          <Ionicons name="checkmark-done-circle" size={40} color="#00A693" />
          <Text style={styles.cardTitle}>Assigned Tasks</Text>
          <Text style={styles.cardSub}>You have 5 tasks</Text>
          <Button
            title="Assign Tasks"
            onPress={() => router.push("/(screens)/assigned-tasks")}
          />
        </View>

        <View style={styles.card}>
          <Ionicons name="folder-open" size={40} color="#9B42F2" />
          <Text style={styles.cardTitle}>Create Project</Text>
          <Text style={styles.cardSub}>Start new project</Text>
          <Button
            title="Create Project"
            onPress={() => router.push("/(screens)/create-project")}
          />
        </View>
      </View>

      {/* STATUS BOX */}
      <View style={styles.statusBox}>
        <Text style={styles.sectionTitle}>Project Status</Text>

        <View style={styles.progressRow}>
          {/* Completed Circle */}
          <View style={styles.circleWrapper}>
            <View style={styles.circleOuter}>
              <View style={styles.circleInner}>
                <Text style={styles.percent}>72%</Text>
                <Text style={styles.label}>Completed</Text>
              </View>
            </View>
          </View>

          {/* Pending Circle */}
          <View style={styles.circleWrapper}>
            <View style={[styles.circleOuter, { borderColor: "#9B42F2" }]}>
              <View style={styles.circleInner}>
                <Text style={styles.percent}>28%</Text>
                <Text style={styles.label}>Pending</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          <Text style={styles.activeTab}>Pending</Text>
          <Text style={styles.inactiveTab}>Completed</Text>
        </View>

        {/* Task List */}
        {[
          "Design Homepage",
          "Write Blog Post",
          "Fix Website Bugs",
          "Research Ideas",
        ].map((task, i) => (
          <View key={i} style={styles.taskItem}>
            <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
            <Text style={styles.taskText}>{task}</Text>
            <Text style={styles.date}>Due: 25 Apr</Text>
          </View>
        ))}

        <View style={{ marginTop: 10 }}>
          <Button title="View All" onPress={() => {}} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#d3d7df",
  },
  header: {
    paddingTop: 60, // Safe area balance
    paddingHorizontal: 20,
    paddingBottom: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: "hidden", // Circle element ko bahar na nikalne dene ke liye
    position: "relative",
  },

  islandWrapper: {
    paddingHorizontal: 15,
    paddingTop: 80, // Screen ke top se gap
    backgroundColor: "#e8eaee",
  },
  islandCard: {
    borderRadius: 25,
    padding: 20,

    backgroundColor: "rgba(255,255,255,0.05)", // 👈 glass feel

    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,

    elevation: 12,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  avatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  welcomeTextGroup: {
    marginLeft: 12,
  },
  helloText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
  },
  dateLabel: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
    marginTop: 2,
  },

  glassIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  activeDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 6,
    height: 6,
    backgroundColor: "#4ADE80", // Neon Green
    borderRadius: 3,
  },
  headerFooter: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  motivationText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 13,
    letterSpacing: 0.3,
  },
  headerContainer: {
    backgroundColor: "#EAF2FF",
    paddingBottom: 40, // Card ko bahar nikalne ke liye space
  },
  headerGradient: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 80, // Extra space for the floating card
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },

  headerCard: {
    backgroundColor: "#4853b1",
    marginHorizontal: 20,
    marginTop: -60, // This creates the floating effect
    borderRadius: 25,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    // Premium Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },

  rightIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerText: {
    marginTop: 20, // 👈 ye line important hai (text neeche laane ke liye)
    zIndex: 2,
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },

  subtitle: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 15,
    marginTop: 5,
    fontWeight: "400",
  },

  headerCircle: {
    position: "absolute",
    bottom: -40,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.15)", // Glass effect
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  avatarMini: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
  },
  iconButton: {
    marginLeft: 18,
    padding: 2,
  },
  notificationDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 7,
    height: 7,
    backgroundColor: "#10B981", // Green dot for active
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#1E3A8A",
  },
  leftIcons: {
    flexDirection: "row",
    alignItems: "center",
  },

  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
  },

  card: {
    width: "48%",
    backgroundColor: "#0F2A5F",
    borderRadius: 15,
    padding: 15,
    elevation: 6,
  },

  cardTitle: {
    fontWeight: "bold",
    marginTop: 10,
    color: "#FFFFFF",
  },

  cardSub: {
    color: "#9CA3AF",
    marginBottom: 10,
  },

  btn: {
    backgroundColor: "#3B82F6",
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
  },

  btnText: {
    color: "#fff",
    fontWeight: "600",
  },

  statusBox: {
    margin: 15,
    backgroundColor: "#0B1F4B", // 🔥 deep dark blue (premium)
    borderRadius: 20,
    padding: 15,

    // 🔥 glass + depth feel
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,

    elevation: 8,
  },

  sectionTitle: {
    fontWeight: "bold",
    marginBottom: 15,
    fontSize: 16,
    color: "#FFFFFF",
  },

  progressRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 15,
  },

  circleWrapper: {
    alignItems: "center",
  },

  circleOuter: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 8,
    borderColor: "#00A693", // ✅ पहले blue था
    justifyContent: "center",
    alignItems: "center",
  },

  circleInner: {
    alignItems: "center",
  },

  smallText: {
    color: "#E0E7FF",
    fontSize: 14,
  },

  percent: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },

  label: {
    color: "#9CA3AF",
  },

  tabRow: {
    flexDirection: "row",
    marginBottom: 10,
  },

  activeTab: {
    backgroundColor: "#00A693", // ✅
    color: "#fff",
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 10,
    marginRight: 10,
  },

  inactiveTab: {
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 10,
  },

  taskItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderColor: "rgba(255,255,255,0.08)", // 🔥 subtle divider
  },

  taskText: {
    flex: 1,
    marginLeft: 10,
    color: "#E0E7FF", // 🔥 soft white (premium)
    fontWeight: "500",
  },

  date: {
    fontSize: 12,
    color: "#9CA3AF",
  },

  viewAll: {
    marginTop: 10,
    backgroundColor: "#3B82F6",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },

  viewAllText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
