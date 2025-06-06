import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import Colors from "@/constants/colors";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ 
        title: "Страница не найдена",
        headerStyle: { backgroundColor: Colors.background.dark },
        headerTintColor: Colors.text.primary
      }} />
      <View style={styles.container}>
        <Text style={styles.title}>Страница не найдена</Text>

        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Вернуться на главную</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: Colors.background.dark,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.text.primary,
    marginBottom: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 16,
    color: Colors.primary,
  },
});