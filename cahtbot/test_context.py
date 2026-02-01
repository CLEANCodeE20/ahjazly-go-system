import requests
import time

def test_conversation():
    print("Testing conversational memory...")
    session_id = "test_user_memory_" + str(int(time.time()))
    
    # Question 1
    print("\n1️⃣ Asking: 'ما هي وسائل الدفع المتاحة؟'")
    resp1 = requests.post(
        "http://localhost:8000/chat",
        json={"message": "ما هي وسائل الدفع المتاحة؟", "user_id": session_id}
    ).json()
    print(f"🤖 Answer: {resp1['answer'][:100]}...")

    # Question 2 (Follow-up)
    print("\n2️⃣ Asking: 'هل توجد طرق أخرى؟'")
    resp2 = requests.post(
        "http://localhost:8000/chat",
        json={"message": "هل توجد طرق أخرى؟", "user_id": session_id}
    ).json()
    print(f"🤖 Answer: {resp2['answer']}")
    
    if "الدفع" in resp2['answer'] or "وسائل" in resp2['answer']:
        print("\n✅ Verification SUCCESS: Bot understood context.")
    else:
        print("\n❌ Verification FAILED: Bot lost context.")

if __name__ == "__main__":
    test_conversation()
