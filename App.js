import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  Alert,
} from "react-native";
import { db } from "./lib/firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import Constants from "expo-constants";

// ★Function部分★ //
export default function App() {
  const [meal, setMeal] = useState("");
  const [meals, setMeals] = useState([]);
  const [isSending, setIsSending] = useState(false); // 追加
  const apiKey = Constants.expoConfig.extra.OPENAI_API_KEY;

  // ✅ meal追加（ChatGPT連携 → Firebase保存）
  const addMeal = async () => {
    if (meal.trim() === "") {
      Alert.alert("入力エラー", "食事内容を入力してください");
      return;
    }

    try {
      const gptResponse = await sendToChatGPT(meal);
      await addDoc(collection(db, "meals"), {
        input: meal,
        gptResponse,
        timestamp: serverTimestamp(),
      });
      setMeal("");
    } catch (error) {
      console.error("追加エラー:", error);
      Alert.alert("追加エラー", "データの追加に失敗しました");
    }
  };

  // ✅ addmeal()の子関数、ChatGPTへプロンプトを投げて結果を受領する関数
  const sendToChatGPT = async (input) => {
    input = "右記の食物に対してカンマ区切りで「カロリー」「タンパク質」「脂質」「炭水化物」「糖質」「食物繊維」を表示してください。「食物」の情報は付与しないでください。単位は付けないでください。ヘッダーは付けないでください" + input

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: input }],
          temperature: 0.7,
        }),
      });


      const data = await res.json();
      return data.choices?.[0]?.message?.content || "エラー：返答なし";
    } catch (error) {
      console.error("ChatGPTエラー:", error);
      return "エラー：API通信失敗";
    }
  };

  // ✅ mealの削除（Firebase上からも削除）
  const deleteMeal = async (id) => {
    try {
      await deleteDoc(doc(db, "meals", id));
    } catch (error) {
      console.error("削除エラー:", error);
      Alert.alert("削除エラー", "データの削除に失敗しました");
    }
  };

  // ✅ Firestoreの"meals"コレクションをリアルタイムで監視してstateに反映する
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "meals"),
      (snapshot) => {
        const fetchedMeals = snapshot.docs.map((doc) => ({
          id: doc.id,
          input: doc.data().input,
          gptResponse: doc.data().gptResponse,
          timestamp: doc.data().timestamp
            ? new Date(doc.data().timestamp.seconds * 1000).toLocaleString()
            : "未登録",
        }));
        setMeals(fetchedMeals);
      },
      (error) => {
        console.error("読み込みエラー:", error);
        Alert.alert("読み込みエラー", "データの取得に失敗しました");
      }
    );

    return () => unsubscribe();
  }, []);

  // ✅ 一覧からgoogleスプレッドシートへ送信。その後削除
  const handlePress = async () => {

    if (meals.length === 0) {
      Alert.alert("送信エラー", "送信するデータがありません");
      return;
    }

    setIsSending(true); // 送信開始

    const payload = {
      input: meal.input,
      gptResponse: meal.gptResponse,
      timestamp: meal.timestamp,
    };

  try {
    for (const mealItem of meals) {
      const payload = {
        input: mealItem.input,
        gptResponse: mealItem.gptResponse,
        timestamp: mealItem.timestamp,
      };

      await fetch("https://script.google.com/macros/s/AKfycbwandEAwnVFXOgG7HbRNU4r_jBJ12auAyty0Py3X4XBZJm4ghb3cDVpY5Y2xp0NRSWazw/exec", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

    // Firebaseから削除 // 🔄 追加
    await deleteDoc(doc(db, "meals", mealItem.id));

  }

  Alert.alert("送信完了", "全データをスプレッドシートに送信しました.");
  setMeals([]);  // 一覧をクリアする

} catch (error) {
  Alert.alert("送信エラー", error.message);
}　finally {
    setIsSending(false); // 送信終了
}
  };


// ★表示部分（HTML)★ //
  const renderHeader = () => (
    <View style={[styles.row, styles.headerRow]}>
      <Text style={[styles.cell, styles.headerCell, { flex: 2 }]}>食事</Text>
      <Text style={[styles.cell, styles.headerCell, { flex: 3 }]}>カロリー, タンパク質, 脂質, 炭水化物, 糖質, 食物繊維</Text>
      <Text style={[styles.cell, styles.headerCell, { flex: 2 }]}>登録日時</Text>
      <Text style={[styles.cell, styles.headerCell, { flex: 1 }]}>操作</Text>
    </View>
  );

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <Text style={[styles.cell, { flex: 2 }]}>{item.input}</Text>
      <Text style={[styles.cell, { flex: 3 }]}>{item.gptResponse}</Text>
      <Text style={[styles.cell, { flex: 2 }]}>{item.timestamp}</Text>
      <View style={[styles.cell, { flex: 1 }]}>
        <Button title="削除" color="red" onPress={() => deleteMeal(item.id)} />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>栄養素計算アプリ</Text>

      <TextInput
        style={styles.input}
        placeholder="食事内容を入力"
        value={meal}
        onChangeText={setMeal}
      />
      <Button title="登録" onPress={addMeal} />
      <Button
        title="スプレッドシートに送信"
        onPress={handlePress}
        disabled={isSending}  // 送信中は無効化
      />
      {isSending && (
        <Text style={{ marginTop: 10, color: "blue", textAlign: "center" }}>
        送信中...
        </Text>
)}

      <FlatList
        data={meals}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        renderItem={renderItem}
        style={{ marginTop: 20 }}
      />
    </View>
  );
}

// ★表示部分（CSS)★ //
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: "center",
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#888",
    padding: 10,
    marginBottom: 10,
    borderRadius: 6,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    paddingVertical: 8,
  },
  headerRow: {
    backgroundColor: "#f0f0f0",
  },
  cell: {
    paddingHorizontal: 8,
  },
  headerCell: {
    fontWeight: "bold",
  },
});
