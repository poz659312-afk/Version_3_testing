import pandas as pd

# دالة تحديد وقت الوصول البيني (IAT) بناءً على الرقم العشوائي
def get_iat(rn):
    if 1 <= rn <= 25:
        return 1
    elif 26 <= rn <= 65:
        return 2
    elif 66 <= rn <= 85:
        return 3
    else:  # 86 - 100 (00 تعني 100)
        return 4

# دالة تحديد وقت خدمة الخادم الأول (Able)
def get_able_st(rn):
    if 1 <= rn <= 30:
        return 2
    elif 31 <= rn <= 58:
        return 3
    elif 59 <= rn <= 83:
        return 4
    else:  # 84 - 100
        return 5

# دالة تحديد وقت خدمة الخادم الثاني (Baker)
def get_baker_st(rn):
    if 1 <= rn <= 35:
        return 2
    elif 36 <= rn <= 60:
        return 3
    elif 61 <= rn <= 80:
        return 4
    else:  # 81 - 100
        return 5

# الأرقام العشوائية المعطاة في السكشن
rn_iat = [None, 26, 98, 90, 26, 42, 74, 80, 68, 22, 48, 34, 45, 24, 34, 63, 38, 80, 42, 56, 89, 18, 51, 71, 16, 92]
rn_st = [95, 21, 51, 92, 89, 38, 13, 61, 50, 49, 39, 53, 88, 1, 81, 53, 81, 64, 1, 67, 1, 47, 75, 57, 87, 47]

num_customers = len(rn_st)
records = []

# متغيرات تتبع حالة الخوادم والوقت
clock = 0
able_free_at = 0
baker_free_at = 0

for i in range(num_customers):
    cust_id = i + 1
    rn_arrival = rn_iat[i]
    
    # 1. تحديد وقت الوصول (Clock)
    if i == 0:
        iat = None
        clock = 0
    else:
        iat = get_iat(rn_arrival)
        clock += iat

    rn_service = rn_st[i]
    
    # 2. تحديد أي خادم سيتولى الطلب وفقاً للأولوية وتوفر الخوادم
    # إذا كان كلاهما متاحاً، تعطى الأولوية لـ Able
    if able_free_at <= clock and baker_free_at <= clock:
        server = 'Able'
    elif able_free_at <= clock:
        server = 'Able'
    elif baker_free_at <= clock:
        server = 'Baker'
    else:
        # إذا كان كلاهما مشغولاً، العميل ينتظر من ينتهي أولاً
        server = 'Able' if able_free_at <= baker_free_at else 'Baker'

    # 3. حساب تفاصيل الخدمة لكل خادم
    able_begins = able_st = able_ends = able_idle = None
    baker_begins = baker_st = baker_ends = baker_idle = None

    if server == 'Able':
        able_begins = max(clock, able_free_at)
        able_st = get_able_st(rn_service)
        able_ends = able_begins + able_st
        service_begin = able_begins
        service_time = able_st
        
        # حساب وقت فراغ الخادم (Idle Time)
        able_idle = able_begins - able_free_at
        able_free_at = able_ends
    else:
        baker_begins = max(clock, baker_free_at)
        baker_st = get_baker_st(rn_service)
        baker_ends = baker_begins + baker_st
        service_begin = baker_begins
        service_time = baker_st
        
        # حساب وقت فراغ الخادم (Idle Time)
        baker_idle = baker_begins - baker_free_at
        baker_free_at = baker_ends

    queue_time = service_begin - clock
    time_in_sys = queue_time + service_time

    records.append({
        'Customer': cust_id,
        'RN IAT': rn_arrival,
        'IAT': iat,
        'Clock': clock,
        'RN Service': rn_service,
        'Able Begins': able_begins,
        'Able ST': able_st,
        'Able Ends': able_ends,
        'Baker Begins': baker_begins,
        'Baker ST': baker_st,
        'Baker Ends': baker_ends,
        'Queuing Time': queue_time,
        'Time in System': time_in_sys,
        'Able Idle': able_idle,
        'Baker Idle': baker_idle
    })

# تحويل النتائج إلى DataFrame
df = pd.DataFrame(records)

# استبدال القيم المفقودة بشرطة أو تركها لتنسيق العرض
df_display = df.fillna('-')

# حساب المؤشرات الإحصائية المطلوبة
total_sim_time = max(df['Able Ends'].dropna().max(), df['Baker Ends'].dropna().max())
total_able_busy = df['Able ST'].dropna().sum()
percentage_able_busy = (total_able_busy / total_sim_time) * 100

waited_customers = df[df['Queuing Time'] > 0]
avg_wait_time = waited_customers['Queuing Time'].sum() / len(waited_customers) if len(waited_customers) > 0 else 0

summary_df = pd.DataFrame({
    'Metric': [
        'Total Simulation Run Time',
        'Total Able Busy Time',
        'Able Busy Percentage (%)',
        'Customers Who Waited',
        'Total Waiting Time',
        'Average Waiting Time (for waiting customers)'
    ],
    'Value': [
        f"{total_sim_time:.0f} mins",
        f"{total_able_busy:.0f} mins",
        f"{percentage_able_busy:.2f}%",
        f"{len(waited_customers)}",
        f"{waited_customers['Queuing Time'].sum():.0f} mins",
        f"{avg_wait_time:.2f} mins"
    ]
})

# طباعة الجداول
print("=== جدول المحاكاة الرئيسي (Simulation Table) ===")
print(df_display.to_string(index=False))

print("\n=== جدول المقاييس والنتائج (Summary Metrics) ===")
print(summary_df.to_string(index=False))