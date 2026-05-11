"""
management/commands/seed_data.py
Run with: python manage.py seed_data

Creates 20 products per category across 8 categories = 160 products total.
"""

from django.core.management.base import BaseCommand
from django.utils                 import timezone
from datetime                     import timedelta
from decimal                      import Decimal


class Command(BaseCommand):
    help = 'Seed the database with demo data for the Racks school project'

    def handle(self, *args, **options):
        self.stdout.write('Seeding database...')
        self.seed_delivery_zones()
        self.seed_categories()
        self.seed_products()
        self.seed_promotion()
        self.stdout.write(self.style.SUCCESS('\nDone! Database seeded successfully.'))
        self.stdout.write('\nDemo credentials:')
        self.stdout.write('  Admin: http://localhost:8000/admin')
        self.stdout.write('  Email:    admin@racks.ug')
        self.stdout.write('  Password: racks2026')

    def seed_delivery_zones(self):
        from delivery.models import DeliveryZone
        ALL_DISTRICTS = [
            ("Kampala",        True,  1,  0,      200000, "Same-day delivery available in Kampala"),
            ("Wakiso",         True,  1,  5000,   200000, "Covers Nansana, Kasangati, Entebbe road"),
            ("Mukono",         True,  2,  8000,   300000, ""),
            ("Entebbe",        True,  2,  10000,  300000, "Includes Entebbe town and peninsula"),
            ("Jinja",          True,  2,  15000,  400000, "Eastern Uganda hub"),
            ("Mbarara",        True,  3,  20000,  500000, "SW Uganda hub"),
            ("Gulu",           True,  3,  25000,  500000, "Northern Uganda hub"),
            ("Mbale",          True,  3,  22000,  500000, "Eastern Uganda hub"),
            ("Masaka",         True,  3,  18000,  400000, "Central Uganda"),
            ("Buikwe",         True,  2,  10000,  300000, ""),
            ("Buvuma",         False, 0, 0, 0, ""),("Bukomansimbi",False,0,0,0,""),
            ("Butambala",      False, 0, 0, 0, ""),("Gomba",False,0,0,0,""),
            ("Kalangala",      False, 0, 0, 0, ""),("Kalungu",False,0,0,0,""),
            ("Kayunga",        False, 0, 0, 0, ""),("Kiboga",False,0,0,0,""),
            ("Kyankwanzi",     False, 0, 0, 0, ""),("Kyotera",False,0,0,0,""),
            ("Luweero",        False, 0, 0, 0, ""),("Lwengo",False,0,0,0,""),
            ("Lyantonde",      False, 0, 0, 0, ""),("Mityana",False,0,0,0,""),
            ("Mpigi",          False, 0, 0, 0, ""),("Mubende",False,0,0,0,""),
            ("Nakaseke",       False, 0, 0, 0, ""),("Nakasongola",False,0,0,0,""),
            ("Rakai",          False, 0, 0, 0, ""),("Sembabule",False,0,0,0,""),
            ("Amuria",         False, 0, 0, 0, ""),("Budaka",False,0,0,0,""),
            ("Bududa",         False, 0, 0, 0, ""),("Bugiri",False,0,0,0,""),
            ("Bugweri",        False, 0, 0, 0, ""),("Bukedea",False,0,0,0,""),
            ("Bukwa",          False, 0, 0, 0, ""),("Bulambuli",False,0,0,0,""),
            ("Busia",          False, 0, 0, 0, ""),("Buyende",False,0,0,0,""),
            ("Iganga",         False, 0, 0, 0, ""),("Kaberamaido",False,0,0,0,""),
            ("Kaliro",         False, 0, 0, 0, ""),("Kamuli",False,0,0,0,""),
            ("Kapchorwa",      False, 0, 0, 0, ""),("Katakwi",False,0,0,0,""),
            ("Kibuku",         False, 0, 0, 0, ""),("Kumi",False,0,0,0,""),
            ("Kween",          False, 0, 0, 0, ""),("Luuka",False,0,0,0,""),
            ("Manafwa",        False, 0, 0, 0, ""),("Mayuge",False,0,0,0,""),
            ("Namayingo",      False, 0, 0, 0, ""),("Namisindwa",False,0,0,0,""),
            ("Namutumba",      False, 0, 0, 0, ""),("Ngora",False,0,0,0,""),
            ("Pallisa",        False, 0, 0, 0, ""),("Serere",False,0,0,0,""),
            ("Sironko",        False, 0, 0, 0, ""),("Soroti",False,0,0,0,""),
            ("Tororo",         False, 0, 0, 0, ""),
            ("Abim",           False, 0, 0, 0, ""),("Adjumani",False,0,0,0,""),
            ("Agago",          False, 0, 0, 0, ""),("Alebtong",False,0,0,0,""),
            ("Amolatar",       False, 0, 0, 0, ""),("Amudat",False,0,0,0,""),
            ("Amuru",          False, 0, 0, 0, ""),("Apac",False,0,0,0,""),
            ("Arua",           False, 0, 0, 0, ""),("Dokolo",False,0,0,0,""),
            ("Kaabong",        False, 0, 0, 0, ""),("Kitgum",False,0,0,0,""),
            ("Koboko",         False, 0, 0, 0, ""),("Kole",False,0,0,0,""),
            ("Kotido",         False, 0, 0, 0, ""),("Kwania",False,0,0,0,""),
            ("Lamwo",          False, 0, 0, 0, ""),("Lira",False,0,0,0,""),
            ("Maracha",        False, 0, 0, 0, ""),("Moroto",False,0,0,0,""),
            ("Moyo",           False, 0, 0, 0, ""),("Nakapiripirit",False,0,0,0,""),
            ("Napak",          False, 0, 0, 0, ""),("Nwoya",False,0,0,0,""),
            ("Obongi",         False, 0, 0, 0, ""),("Omoro",False,0,0,0,""),
            ("Otuke",          False, 0, 0, 0, ""),("Oyam",False,0,0,0,""),
            ("Pader",          False, 0, 0, 0, ""),("Pakwach",False,0,0,0,""),
            ("Terego",         False, 0, 0, 0, ""),("Yumbe",False,0,0,0,""),
            ("Zombo",          False, 0, 0, 0, ""),
            ("Buliisa",        False, 0, 0, 0, ""),("Bundibugyo",False,0,0,0,""),
            ("Bushenyi",       False, 0, 0, 0, ""),("Buhweju",False,0,0,0,""),
            ("Bunyangabu",     False, 0, 0, 0, ""),("Hoima",False,0,0,0,""),
            ("Ibanda",         False, 0, 0, 0, ""),("Isingiro",False,0,0,0,""),
            ("Kabale",         False, 0, 0, 0, ""),("Kabarole",False,0,0,0,""),
            ("Kagadi",         False, 0, 0, 0, ""),("Kakumiro",False,0,0,0,""),
            ("Kamwenge",       False, 0, 0, 0, ""),("Kanungu",False,0,0,0,""),
            ("Kasese",         False, 0, 0, 0, ""),("Kibaale",False,0,0,0,""),
            ("Kibale",         False, 0, 0, 0, ""),("Kikuube",False,0,0,0,""),
            ("Kiruhura",       False, 0, 0, 0, "The district Dombelo confused with Mbarara"),
            ("Kiryandongo",    False, 0, 0, 0, ""),("Kisoro",False,0,0,0,""),
            ("Kitagwenda",     False, 0, 0, 0, ""),("Kyegegwa",False,0,0,0,""),
            ("Kyenjojo",       False, 0, 0, 0, ""),("Masindi",False,0,0,0,""),
            ("Mitooma",        False, 0, 0, 0, ""),("Ntoroko",False,0,0,0,""),
            ("Ntungamo",       False, 0, 0, 0, ""),("Rubanda",False,0,0,0,""),
            ("Rubirizi",       False, 0, 0, 0, ""),("Rukiga",False,0,0,0,""),
            ("Rukungiri",      False, 0, 0, 0, ""),("Rwampara",False,0,0,0,""),
            ("Sheema",         False, 0, 0, 0, ""),("Fortportal",False,0,0,0,""),
        ]
        created_count = 0
        for district, covered, days, fee, free_above, notes in ALL_DISTRICTS:
            _, created = DeliveryZone.objects.get_or_create(
                district=district,
                defaults={'is_covered':covered,'delivery_days':days,'delivery_fee':fee,'free_above':free_above,'notes':notes}
            )
            if created:
                created_count += 1
        self.stdout.write(f'  + {created_count} delivery zones seeded')

    def seed_categories(self):
        from products.models import Category
        categories = [
            ('Electronics',  'electronics',  '📱'),
            ('TVs & Audio',  'tvs-audio',    '📺'),
            ('Kitchen',      'kitchen',      '🍳'),
            ('Appliances',   'appliances',   '❄️'),
            ('Fashion',      'fashion',      '👔'),
            ('Computing',    'computing',    '💻'),
            ('Phones',       'phones',       '📞'),
            ('Home & Living','home-living',  '🛋️'),
        ]
        for name, slug, icon in categories:
            _, created = Category.objects.get_or_create(slug=slug, defaults={'name':name,'icon':icon,'is_active':True})
            if created:
                self.stdout.write(f'  + Category: {name}')

    def seed_products(self):
        from products.models import Category, Product

        def cat(slug):
            return Category.objects.filter(slug=slug).first()

        ALL_PRODUCTS = [

            # ── PHONES (20) ───────────────────────────────────────────
            dict(name='Samsung Galaxy A55 5G',slug='samsung-galaxy-a55-5g',brand='Samsung',category='phones',price=1450000,stock_qty=12,description='6.6" Super AMOLED, 50MP camera, 5000mAh, 5G ready. One UI 6.1.',attributes={'storage':'128GB','ram':'8GB','battery':'5000mAh','camera':'50MP'}),
            dict(name='Tecno Spark 20 Pro+ 256GB',slug='tecno-spark-20-pro-256gb',brand='Tecno',category='phones',price=620000,stock_qty=14,description='6.78" FHD+, 64MP camera, 5000mAh, Android 13.',attributes={'storage':'256GB','ram':'8GB','camera':'64MP','battery':'5000mAh'}),
            dict(name='iPhone 14 128GB',slug='iphone-14-128gb',brand='Apple',category='phones',price=3200000,stock_qty=4,description='A15 Bionic chip, 12MP dual camera, 5G. 1-year Apple warranty.',attributes={'storage':'128GB','chip':'A15 Bionic','camera':'12MP Dual','battery':'All-day'}),
            dict(name='Infinix Hot 40i',slug='infinix-hot-40i',brand='Infinix',category='phones',price=450000,stock_qty=22,description='6.56" display, 5000mAh battery. Best entry-level phone in Uganda.',attributes={'storage':'128GB','ram':'4GB','battery':'5000mAh','display':'6.56 inches'}),
            dict(name='Samsung Galaxy A35 5G',slug='samsung-galaxy-a35-5g',brand='Samsung',category='phones',price=1250000,stock_qty=9,description='6.6" AMOLED, 50MP triple camera, 5000mAh, 5G.',attributes={'storage':'128GB','ram':'6GB','camera':'50MP Triple','5g':'Yes'}),
            dict(name='Tecno Phantom V Fold',slug='tecno-phantom-v-fold',brand='Tecno',category='phones',price=2800000,stock_qty=3,description='First foldable phone in Uganda. 7.85" inner display, 50MP camera.',attributes={'display':'7.85 inches foldable','ram':'12GB','storage':'256GB','camera':'50MP'}),
            dict(name='Itel P55',slug='itel-p55',brand='Itel',category='phones',price=320000,stock_qty=30,description='6.6" display, 5000mAh, 13MP camera. Budget powerhouse.',attributes={'storage':'128GB','ram':'4GB','battery':'5000mAh','display':'6.6 inches'}),
            dict(name='Samsung Galaxy S23 FE',slug='samsung-galaxy-s23-fe',brand='Samsung',category='phones',price=1950000,stock_qty=6,description='6.4" AMOLED, 50MP triple camera, 4500mAh. Galaxy flagship features.',attributes={'storage':'128GB','ram':'8GB','camera':'50MP Triple','display':'6.4 AMOLED'}),
            dict(name='Xiaomi Redmi Note 13',slug='xiaomi-redmi-note-13',brand='Xiaomi',category='phones',price=780000,stock_qty=16,description='6.67" AMOLED, 108MP camera, 5000mAh. MIUI 14.',attributes={'storage':'256GB','ram':'8GB','camera':'108MP','battery':'5000mAh'}),
            dict(name='Vivo Y36',slug='vivo-y36',brand='Vivo',category='phones',price=680000,stock_qty=11,description='6.64" IPS, 50MP camera, 5000mAh, 44W fast charge.',attributes={'storage':'128GB','ram':'8GB','camera':'50MP','charge':'44W Fast'}),
            dict(name='Tecno Camon 20 Pro',slug='tecno-camon-20-pro',brand='Tecno',category='phones',price=850000,stock_qty=10,description='6.67" AMOLED, 64MP camera, 5000mAh. Portrait specialist.',attributes={'storage':'256GB','ram':'8GB','camera':'64MP AMOLED','battery':'5000mAh'}),
            dict(name='Infinix Zero 30 5G',slug='infinix-zero-30-5g',brand='Infinix',category='phones',price=950000,stock_qty=7,description='6.78" 144Hz AMOLED, 50MP, 5000mAh, 5G. Premium mid-range.',attributes={'storage':'256GB','ram':'12GB','display':'144Hz AMOLED','5g':'Yes'}),
            dict(name='Samsung Galaxy M54',slug='samsung-galaxy-m54',brand='Samsung',category='phones',price=1100000,stock_qty=8,description='6.7" Super AMOLED+, 108MP triple camera, 6000mAh monster battery.',attributes={'storage':'128GB','ram':'8GB','battery':'6000mAh','camera':'108MP Triple'}),
            dict(name='Itel A70',slug='itel-a70',brand='Itel',category='phones',price=220000,stock_qty=40,description='6.6" display, 5000mAh, 8MP camera. Most affordable smartphone.',attributes={'storage':'64GB','ram':'2GB','battery':'5000mAh','display':'6.6 inches'}),
            dict(name='Nokia G42 5G',slug='nokia-g42-5g',brand='Nokia',category='phones',price=720000,stock_qty=9,description='6.56" LCD, 50MP triple camera, 5000mAh, 5G. Pure Android 13.',attributes={'storage':'128GB','ram':'6GB','5g':'Yes','os':'Android 13'}),
            dict(name='Tecno Pova 6 Pro',slug='tecno-pova-6-pro',brand='Tecno',category='phones',price=750000,stock_qty=13,description='6.78" AMOLED 120Hz, 5000mAh, 70W fast charge. Gaming beast.',attributes={'storage':'256GB','ram':'8GB','charge':'70W Fast','display':'120Hz AMOLED'}),
            dict(name='Google Pixel 7a',slug='google-pixel-7a',brand='Google',category='phones',price=1600000,stock_qty=5,description='6.1" OLED, 64MP camera, 5G, 4385mAh. Tensor G2 chip. 5 years of updates.',attributes={'storage':'128GB','chip':'Tensor G2','camera':'64MP','5g':'Yes'}),
            dict(name='Huawei Nova 12i',slug='huawei-nova-12i',brand='Huawei',category='phones',price=680000,stock_qty=11,description='6.7" LCD, 108MP camera, 4000mAh. EMUI 13.',attributes={'storage':'128GB','ram':'8GB','camera':'108MP','display':'6.7 inches'}),
            dict(name='Samsung Galaxy A15 5G',slug='samsung-galaxy-a15-5g',brand='Samsung',category='phones',price=680000,stock_qty=18,description='6.5" Super AMOLED, 50MP triple camera, 5000mAh, 5G.',attributes={'storage':'128GB','ram':'4GB','5g':'Yes','camera':'50MP Triple'}),
            dict(name='Infinix Smart 8 Plus',slug='infinix-smart-8-plus',brand='Infinix',category='phones',price=280000,stock_qty=35,description='6.6" display, 5000mAh. Ultra-affordable 4G smartphone.',attributes={'storage':'64GB','ram':'3GB','battery':'5000mAh','display':'6.6 inches'}),

            # ── TVs & AUDIO (20) ──────────────────────────────────────
            dict(name='Samsung 43" QLED 4K Smart TV',slug='samsung-43-qled-4k',brand='Samsung',category='tvs-audio',price=1450000,stock_qty=8,description='Crystal-clear 4K display with Tizen smart OS. Built-in WiFi, Netflix, YouTube.',attributes={'screen':'43 inches','resolution':'4K UHD','os':'Tizen','hdmi':'3 ports'}),
            dict(name='Hisense 32" Smart TV',slug='hisense-32-smart-tv',brand='Hisense',category='tvs-audio',price=680000,stock_qty=9,description='HD Ready smart TV with VIDAA OS. Built-in WiFi, HDMI x2.',attributes={'screen':'32 inches','resolution':'HD Ready','os':'VIDAA','hdmi':'2 ports'}),
            dict(name='LG 55" 4K NanoCell TV',slug='lg-55-nanocell-4k',brand='LG',category='tvs-audio',price=2200000,stock_qty=4,description='55" 4K NanoCell display, webOS 23, Dolby Vision & Atmos.',attributes={'screen':'55 inches','resolution':'4K NanoCell','os':'webOS','dolby':'Vision + Atmos'}),
            dict(name='TCL 50" 4K Android TV',slug='tcl-50-4k-android',brand='TCL',category='tvs-audio',price=1150000,stock_qty=7,description='50" 4K HDR, Android TV 11, Google Assistant built-in.',attributes={'screen':'50 inches','resolution':'4K HDR','os':'Android TV 11','assistant':'Google'}),
            dict(name='Sony WH-1000XM5 Headphones',slug='sony-wh-1000xm5-headphones',brand='Sony',category='tvs-audio',price=750000,stock_qty=4,description='Industry-leading noise cancellation. 30-hour battery. USB-C charging.',attributes={'type':'Over-ear','anc':'Yes','battery':'30 hours','charging':'USB-C'}),
            dict(name='JBL Charge 5 Bluetooth Speaker',slug='jbl-charge-5',brand='JBL',category='tvs-audio',price=420000,stock_qty=12,description='IP67 waterproof, 20hrs playtime, built-in powerbank. Loud bass.',attributes={'battery':'20 hours','waterproof':'IP67','powerbank':'Yes','watts':'30W'}),
            dict(name='Samsung 32" Smart TV',slug='samsung-32-smart-tv',brand='Samsung',category='tvs-audio',price=750000,stock_qty=11,description='HD Smart TV with Tizen OS. AirPlay 2, SmartThings compatible.',attributes={'screen':'32 inches','resolution':'HD Ready','os':'Tizen','airplay':'Yes'}),
            dict(name='Sony Bravia 40" Full HD TV',slug='sony-bravia-40-fhd',brand='Sony',category='tvs-audio',price=980000,stock_qty=6,description='Full HD, TRILUMINOS PRO display, X-Reality PRO processor.',attributes={'screen':'40 inches','resolution':'Full HD','processor':'X-Reality PRO','hdmi':'2 ports'}),
            dict(name='JBL Flip 6 Portable Speaker',slug='jbl-flip-6',brand='JBL',category='tvs-audio',price=280000,stock_qty=15,description='IP67 waterproof, 12hrs playtime, PartyBoost. Compact and loud.',attributes={'battery':'12 hours','waterproof':'IP67','partyboost':'Yes','watts':'20W'}),
            dict(name='Hisense 55" 4K Smart TV',slug='hisense-55-4k',brand='Hisense',category='tvs-audio',price=1380000,stock_qty=5,description='55" 4K UHD, VIDAA OS, Dolby Vision, built-in WiFi + Bluetooth.',attributes={'screen':'55 inches','resolution':'4K UHD','os':'VIDAA','dolby':'Vision'}),
            dict(name='Samsung Soundbar HW-B450',slug='samsung-soundbar-hw-b450',brand='Samsung',category='tvs-audio',price=480000,stock_qty=8,description='2.1ch, 300W, Dolby Audio, DTS Virtual:X. Wireless subwoofer.',attributes={'channels':'2.1','power':'300W','dolby':'Audio','subwoofer':'Wireless'}),
            dict(name='Anker Soundcore 3 Speaker',slug='anker-soundcore-3',brand='Anker',category='tvs-audio',price=145000,stock_qty=20,description='24hrs battery, IPX5 waterproof, BassUp technology. Budget pick.',attributes={'battery':'24 hours','waterproof':'IPX5','bassup':'Yes','bluetooth':'5.0'}),
            dict(name='TCL 32" LED TV',slug='tcl-32-led-tv',brand='TCL',category='tvs-audio',price=480000,stock_qty=13,description='HD Ready LED, HDMI x2, USB x1. No smart functions — simple and reliable.',attributes={'screen':'32 inches','resolution':'HD Ready','hdmi':'2 ports','smart':'No'}),
            dict(name='Sony MDR-XB550AP Headphones',slug='sony-mdr-xb550ap',brand='Sony',category='tvs-audio',price=120000,stock_qty=18,description='Extra Bass wired headphones, 30mm driver, foldable, in-line mic.',attributes={'type':'On-ear wired','driver':'30mm Extra Bass','mic':'Yes','foldable':'Yes'}),
            dict(name='LG 43" Full HD Smart TV',slug='lg-43-fhd-smart',brand='LG',category='tvs-audio',price=980000,stock_qty=7,description='43" FHD, webOS 22, ThinQ AI, HDR10.',attributes={'screen':'43 inches','resolution':'Full HD','os':'webOS 22','hdr':'HDR10'}),
            dict(name='Xiaomi Smart TV 5A 32"',slug='xiaomi-smart-tv-5a-32',brand='Xiaomi',category='tvs-audio',price=560000,stock_qty=10,description='32" HD, Android TV 11, Google Assistant, Chromecast built-in.',attributes={'screen':'32 inches','resolution':'HD Ready','os':'Android TV 11','chromecast':'Built-in'}),
            dict(name='JBL Go 3 Mini Speaker',slug='jbl-go-3',brand='JBL',category='tvs-audio',price=85000,stock_qty=25,description='IP67 waterproof, 5hrs battery, ultra-portable. Fits in your pocket.',attributes={'battery':'5 hours','waterproof':'IP67','weight':'209g','bluetooth':'5.1'}),
            dict(name='Hisense 43" 4K Smart TV',slug='hisense-43-4k',brand='Hisense',category='tvs-audio',price=980000,stock_qty=8,description='43" 4K UHD VIDAA OS, Dolby Audio, 3x HDMI.',attributes={'screen':'43 inches','resolution':'4K UHD','hdmi':'3 ports','dolby':'Audio'}),
            dict(name='Sony SRS-XB23 Speaker',slug='sony-srs-xb23',brand='Sony',category='tvs-audio',price=220000,stock_qty=14,description='IP67 waterproof, 12hrs battery, Extra Bass, multi-speaker pairing.',attributes={'battery':'12 hours','waterproof':'IP67','extra_bass':'Yes','bluetooth':'5.0'}),
            dict(name='Samsung 50" 4K Smart TV',slug='samsung-50-4k-smart',brand='Samsung',category='tvs-audio',price=1280000,stock_qty=6,description='50" 4K UHD, Tizen OS, PurColor display, Alexa built-in.',attributes={'screen':'50 inches','resolution':'4K UHD','os':'Tizen','alexa':'Built-in'}),

            # ── KITCHEN (20) ──────────────────────────────────────────
            dict(name='Ramtons 4-Burner Gas Cooker',slug='ramtons-4-burner-gas-cooker',brand='Ramtons',category='kitchen',price=480000,stock_qty=6,description='Stainless steel body. Auto-ignition. 1 large + 3 medium burners. Glass lid.',attributes={'burners':'4','ignition':'Auto','material':'Stainless Steel','oven':'Yes'}),
            dict(name='Roch 2-in-1 Blender and Juicer',slug='roch-2-in-1-blender-juicer',brand='Roch',category='kitchen',price=96000,stock_qty=20,description='Powerful 800W blender with juicer attachment. 1.5L jar. Stainless steel blades.',attributes={'power':'800W','capacity':'1.5L','functions':'Blend, Juice, Grind'}),
            dict(name='Ramtons Microwave Oven 20L',slug='ramtons-microwave-20l',brand='Ramtons',category='kitchen',price=280000,stock_qty=14,description='20L capacity, 700W, 5 power levels, 30-min timer. Auto defrost.',attributes={'capacity':'20L','power':'700W','levels':'5','timer':'30 min'}),
            dict(name='Bruhm 2-Slice Pop-Up Toaster',slug='bruhm-2-slice-toaster',brand='Bruhm',category='kitchen',price=65000,stock_qty=28,description='2-slice toaster, 6 browning levels, cancel & defrost buttons.',attributes={'slices':'2','settings':'6 browning levels','cancel':'Yes','defrost':'Yes'}),
            dict(name='Ramtons Electric Kettle 1.8L',slug='ramtons-electric-kettle',brand='Ramtons',category='kitchen',price=58000,stock_qty=32,description='1.8L stainless steel kettle, 2200W, auto shut-off, 360° cordless base.',attributes={'capacity':'1.8L','power':'2200W','auto_shutoff':'Yes','material':'Stainless Steel'}),
            dict(name='Kenwood 3-in-1 Hand Blender',slug='kenwood-hand-blender',brand='Kenwood',category='kitchen',price=145000,stock_qty=16,description='Hand blender, chopper and whisk. 650W, variable speed.',attributes={'power':'650W','functions':'3-in-1','speed':'Variable','attachments':'Chopper + Whisk'}),
            dict(name='Ramtons 6-Burner Gas Cooker',slug='ramtons-6-burner-gas-cooker',brand='Ramtons',category='kitchen',price=680000,stock_qty=4,description='6 burners, large oven, auto-ignition, stainless steel. Family size.',attributes={'burners':'6','oven':'Large','ignition':'Auto','material':'Stainless Steel'}),
            dict(name='Binatone Rice Cooker 1.8L',slug='binatone-rice-cooker',brand='Binatone',category='kitchen',price=85000,stock_qty=22,description='1.8L, auto keep-warm, non-stick pot. Cooks rice, stew, and porridge.',attributes={'capacity':'1.8L','keep_warm':'Auto','pot':'Non-stick','functions':'Rice, Stew, Porridge'}),
            dict(name='Anex Sandwich Maker',slug='anex-sandwich-maker',brand='Anex',category='kitchen',price=78000,stock_qty=25,description='Non-stick plates, power indicator, makes 2 sandwiches at a time.',attributes={'plates':'Non-stick','indicator':'Yes','sandwiches':'2 at once','material':'Plastic body'}),
            dict(name='Ramtons Standing Mixer 5L',slug='ramtons-standing-mixer',brand='Ramtons',category='kitchen',price=320000,stock_qty=7,description='5L bowl, 6 speed settings, 1000W. Comes with dough hook, whisk, and beater.',attributes={'bowl':'5L','speeds':'6','power':'1000W','attachments':'Hook, Whisk, Beater'}),
            dict(name='Westpoint Deep Fryer 2.5L',slug='westpoint-deep-fryer',brand='Westpoint',category='kitchen',price=195000,stock_qty=11,description='2.5L oil capacity, 1800W, temperature control, cool-touch handle.',attributes={'capacity':'2.5L','power':'1800W','temp_control':'Yes','handle':'Cool-touch'}),
            dict(name='Ramtons 4-Slice Toaster Oven',slug='ramtons-toaster-oven',brand='Ramtons',category='kitchen',price=185000,stock_qty=9,description='4-slice capacity, 1200W, bake/grill/toast functions, 60-min timer.',attributes={'capacity':'4 slices','power':'1200W','functions':'Bake, Grill, Toast','timer':'60 min'}),
            dict(name='Bruhm Hand Mixer 250W',slug='bruhm-hand-mixer',brand='Bruhm',category='kitchen',price=55000,stock_qty=30,description='5-speed hand mixer with turbo boost. Stainless steel beaters.',attributes={'power':'250W','speeds':'5 + Turbo','beaters':'Stainless Steel','ejector':'Yes'}),
            dict(name='Nexus Juice Extractor 600W',slug='nexus-juice-extractor',brand='Nexus',category='kitchen',price=120000,stock_qty=18,description='600W juicer with anti-drip cap, 2 speed settings, large feeding tube.',attributes={'power':'600W','speeds':'2','anti_drip':'Yes','tube':'Large feeding'}),
            dict(name='Ramtons Non-Stick Cookware Set 8pc',slug='ramtons-cookware-set',brand='Ramtons',category='kitchen',price=185000,stock_qty=12,description='8-piece non-stick cookware set. Suitable for all hob types.',attributes={'pieces':'8','coating':'Non-stick','hob':'All types','material':'Aluminium'}),
            dict(name='Binatone Food Processor 650W',slug='binatone-food-processor',brand='Binatone',category='kitchen',price=245000,stock_qty=8,description='10-in-1 food processor. Chops, slices, shreds, blends, whisks.',attributes={'power':'650W','functions':'10-in-1','bowl':'1.5L','attachments':'Multiple'}),
            dict(name='Anex Electric Pressure Cooker 6L',slug='anex-pressure-cooker',brand='Anex',category='kitchen',price=285000,stock_qty=7,description='6L digital pressure cooker. 12 cooking programs. Delayed start.',attributes={'capacity':'6L','programs':'12','pressure':'Digital control','delay':'Yes'}),
            dict(name='Ramtons Gas + Electric Cooker',slug='ramtons-gas-electric-cooker',brand='Ramtons',category='kitchen',price=750000,stock_qty=4,description='4 gas burners + 1 electric plate. Large oven. Best of both worlds.',attributes={'burners':'4 gas + 1 electric','oven':'Large','ignition':'Auto','panel':'Control panel'} ),
            dict(name='Kenwood Food Chopper 400W',slug='kenwood-food-chopper',brand='Kenwood',category='kitchen',price=95000,stock_qty=20,description='1.4L capacity, 400W, stainless steel blades, dishwasher-safe bowl.',attributes={'capacity':'1.4L','power':'400W','blades':'Stainless Steel','dishwasher_safe':'Yes'}),
            dict(name='Westpoint Air Fryer 3.5L',slug='westpoint-air-fryer',brand='Westpoint',category='kitchen',price=320000,stock_qty=10,description='3.5L air fryer, 1500W, digital display, 8 presets. 80% less oil.',attributes={'capacity':'3.5L','power':'1500W','presets':'8','display':'Digital'}),

            # ── APPLIANCES (20) ───────────────────────────────────────
            dict(name='LG 220L Double Door Refrigerator',slug='lg-220l-double-door-fridge',brand='LG',category='appliances',price=2100000,stock_qty=5,description='Energy-efficient double door fridge. Smart Inverter Compressor. 10-year warranty.',attributes={'capacity':'220L','type':'Double Door','inverter':'Yes','energy_star':'A++'}),
            dict(name='Hisense 150L Single Door Fridge',slug='hisense-150l-single-door',brand='Hisense',category='appliances',price=950000,stock_qty=8,description='150L single door refrigerator. Multi Air Flow, reversible door.',attributes={'capacity':'150L','type':'Single Door','airflow':'Multi Air Flow','door':'Reversible'}),
            dict(name='Samsung 7kg Front Load Washing Machine',slug='samsung-7kg-front-load',brand='Samsung',category='appliances',price=1850000,stock_qty=4,description='7kg, Eco Bubble Technology, 1400 RPM, 15 wash programs.',attributes={'capacity':'7kg','type':'Front Load','rpm':'1400','programs':'15'}),
            dict(name='LG 7kg Top Load Washing Machine',slug='lg-7kg-top-load',brand='LG',category='appliances',price=1450000,stock_qty=6,description='7kg top loader, Smart Inverter Motor, 8 wash programs, child lock.',attributes={'capacity':'7kg','type':'Top Load','inverter':'Yes','programs':'8'}),
            dict(name='Midea 1.5HP Window AC Unit',slug='midea-1-5hp-window-ac',brand='Midea',category='appliances',price=1250000,stock_qty=5,description='1.5HP window air conditioner, 12000 BTU, cooling + fan + dehumidify.',attributes={'capacity':'1.5HP / 12000BTU','modes':'Cool, Fan, Dehumidify','filter':'Washable','voltage':'220V'}),
            dict(name='Samsung 310L French Door Fridge',slug='samsung-310l-french-door',brand='Samsung',category='appliances',price=2800000,stock_qty=3,description='310L French door refrigerator, Twin Cooling Plus, No Frost.',attributes={'capacity':'310L','type':'French Door','cooling':'Twin Cooling Plus','frost':'No Frost'}),
            dict(name='Hisense Chest Freezer 200L',slug='hisense-chest-freezer-200l',brand='Hisense',category='appliances',price=980000,stock_qty=7,description='200L chest freezer, fast freeze, low noise, lockable lid.',attributes={'capacity':'200L','type':'Chest Freezer','fast_freeze':'Yes','lock':'Yes'}),
            dict(name='LG 9kg Tumble Dryer',slug='lg-9kg-tumble-dryer',brand='LG',category='appliances',price=1750000,stock_qty=3,description='9kg condenser dryer, Inverter Direct Drive, 12 programs, sensor dry.',attributes={'capacity':'9kg','type':'Condenser','programs':'12','sensor':'Smart Sensor'}),
            dict(name='Panasonic 18000 BTU Split AC',slug='panasonic-18000-btu-split-ac',brand='Panasonic',category='appliances',price=2200000,stock_qty=4,description='18000 BTU inverter split AC. Nanoe-X air purification. 5-star energy rating.',attributes={'capacity':'18000 BTU','type':'Split Inverter','purification':'Nanoe-X','energy':'5-star'}),
            dict(name='Samsung 8kg Washing Machine',slug='samsung-8kg-washing-machine',brand='Samsung',category='appliances',price=2100000,stock_qty=4,description='8kg front loader, Eco Bubble, AI Control, 1400 RPM. Digital Inverter.',attributes={'capacity':'8kg','type':'Front Load','ai_control':'Yes','inverter':'Digital'}),
            dict(name='Hisense 300L Side by Side Fridge',slug='hisense-300l-side-by-side',brand='Hisense',category='appliances',price=3200000,stock_qty=2,description='300L side-by-side, No Frost, water + ice dispenser, multi air flow.',attributes={'capacity':'300L','type':'Side by Side','dispenser':'Water + Ice','frost':'No Frost'}),
            dict(name='Midea 1HP Split AC',slug='midea-1hp-split-ac',brand='Midea',category='appliances',price=1650000,stock_qty=5,description='1HP inverter split AC. R32 refrigerant. Self-cleaning. WiFi control.',attributes={'capacity':'1HP / 9000BTU','inverter':'Yes','wifi':'Yes','r32':'Yes'}),
            dict(name='LG 260L Double Door Fridge',slug='lg-260l-double-door',brand='LG',category='appliances',price=2450000,stock_qty=4,description='260L Multi Air Flow, Door Cooling+, Smart Inverter, A++ energy.',attributes={'capacity':'260L','type':'Double Door','cooling':'Door Cooling+','energy':'A++'}),
            dict(name='Samsung 5kg Twin Tub Washer',slug='samsung-5kg-twin-tub',brand='Samsung',category='appliances',price=680000,stock_qty=9,description='5kg semi-automatic twin tub. Wash + spin simultaneously.',attributes={'capacity':'5kg wash + 3kg spin','type':'Semi-auto Twin Tub','simultaneous':'Yes','voltage':'220V'}),
            dict(name='Hisense 350L Chest Freezer',slug='hisense-350l-chest-freezer',brand='Hisense',category='appliances',price=1450000,stock_qty=4,description='350L commercial chest freezer. Fast freeze, anti-corrosion interior.',attributes={'capacity':'350L','fast_freeze':'Yes','interior':'Anti-corrosion','lock':'Yes'}),
            dict(name='Panasonic 1.5HP Split AC',slug='panasonic-1-5hp-split-ac',brand='Panasonic',category='appliances',price=1950000,stock_qty=4,description='1.5HP inverter split AC, Econavi sensor, Nanoe-X purification.',attributes={'capacity':'1.5HP','inverter':'Yes','econavi':'Yes','purification':'Nanoe-X'}),
            dict(name='LG 50L Microwave Oven',slug='lg-50l-microwave',brand='LG',category='appliances',price=650000,stock_qty=6,description='50L solo microwave, 900W, auto cook menu, easy clean interior.',attributes={'capacity':'50L','power':'900W','auto_cook':'Yes','interior':'Easy Clean'}),
            dict(name='Samsung 4.5kg Top Load Washer',slug='samsung-4-5kg-top-load',brand='Samsung',category='appliances',price=980000,stock_qty=7,description='4.5kg top loader, Digital Inverter Motor, 8 programs, child lock.',attributes={'capacity':'4.5kg','type':'Top Load','inverter':'Digital','programs':'8'}),
            dict(name='Hisense 70L Table Top Fridge',slug='hisense-70l-table-top',brand='Hisense',category='appliances',price=580000,stock_qty=10,description='70L table top refrigerator. Perfect for bedrooms and offices.',attributes={'capacity':'70L','type':'Table Top','reversible_door':'Yes','energy':'A+'}),
            dict(name='Midea 12000 BTU Portable AC',slug='midea-12000-btu-portable',brand='Midea',category='appliances',price=1850000,stock_qty=3,description='12000 BTU portable AC. No installation needed. WiFi control.',attributes={'capacity':'12000 BTU','type':'Portable','wifi':'Yes','installation':'None required'}),

            # ── COMPUTING (20) ────────────────────────────────────────
            dict(name='HP Laptop 15s Intel Core i5',slug='hp-laptop-15s-intel-i5',brand='HP',category='computing',price=1850000,stock_qty=12,description='15.6" FHD screen. 8GB RAM, 512GB SSD. Windows 11. 1-year warranty.',attributes={'processor':'Intel i5 12th Gen','ram':'8GB','storage':'512GB SSD','os':'Windows 11'}),
            dict(name='Lenovo IdeaPad 3 Core i3',slug='lenovo-ideapad-3-i3',brand='Lenovo',category='computing',price=1350000,stock_qty=9,description='15.6" FHD, Intel Core i3, 8GB RAM, 256GB SSD. Thin and light.',attributes={'processor':'Intel i3 12th Gen','ram':'8GB','storage':'256GB SSD','display':'15.6 FHD'}),
            dict(name='Dell Latitude 3420 Core i5',slug='dell-latitude-3420-i5',brand='Dell',category='computing',price=1950000,stock_qty=6,description='14" FHD, Core i5, 8GB RAM, 256GB SSD. Business-grade reliability.',attributes={'processor':'Intel i5 11th Gen','ram':'8GB','storage':'256GB SSD','build':'Business grade'}),
            dict(name='HP 250 G9 Core i7',slug='hp-250-g9-i7',brand='HP',category='computing',price=2450000,stock_qty=4,description='15.6" FHD, Core i7, 16GB RAM, 512GB SSD. For heavy workloads.',attributes={'processor':'Intel i7 12th Gen','ram':'16GB','storage':'512GB SSD','display':'15.6 FHD'}),
            dict(name='Acer Aspire 5 Core i5',slug='acer-aspire-5-i5',brand='Acer',category='computing',price=1750000,stock_qty=7,description='15.6" FHD IPS, Core i5, 8GB RAM, 512GB SSD, Backlit keyboard.',attributes={'processor':'Intel i5 12th Gen','ram':'8GB','storage':'512GB SSD','keyboard':'Backlit'}),
            dict(name='Lenovo ThinkPad E14 Core i5',slug='lenovo-thinkpad-e14-i5',brand='Lenovo',category='computing',price=2100000,stock_qty=5,description='14" FHD IPS, Core i5, 8GB RAM, 256GB SSD. Legendary ThinkPad build.',attributes={'processor':'Intel i5 12th Gen','ram':'8GB','storage':'256GB SSD','build':'ThinkPad grade'}),
            dict(name='HP Chromebook 14a',slug='hp-chromebook-14a',brand='HP',category='computing',price=980000,stock_qty=8,description='14" HD, MediaTek MT8183, 4GB RAM, 64GB eMMC. ChromeOS. 12hr battery.',attributes={'processor':'MediaTek MT8183','ram':'4GB','storage':'64GB eMMC','battery':'12 hours'}),
            dict(name='Logitech MX Keys Keyboard',slug='logitech-mx-keys',brand='Logitech',category='computing',price=280000,stock_qty=14,description='Wireless illuminated keyboard. Bluetooth + USB. Works on 3 devices.',attributes={'connectivity':'Bluetooth + USB','backlit':'Yes','devices':'3','battery':'10 days lit'}),
            dict(name='Logitech MX Master 3 Mouse',slug='logitech-mx-master-3',brand='Logitech',category='computing',price=220000,stock_qty=16,description='Advanced wireless mouse. MagSpeed scroll, 8K DPI, USB-C charging.',attributes={'dpi':'8000','scroll':'MagSpeed','charging':'USB-C','connectivity':'Bluetooth + USB'}),
            dict(name='Samsung 24" FHD Monitor',slug='samsung-24-fhd-monitor',brand='Samsung',category='computing',price=520000,stock_qty=10,description='24" FHD IPS, 75Hz, HDMI + VGA. Eye care technology.',attributes={'screen':'24 inches','resolution':'FHD 1080p','refresh':'75Hz','ports':'HDMI + VGA'}),
            dict(name='HP LaserJet Pro M15w Printer',slug='hp-laserjet-pro-m15w',brand='HP',category='computing',price=480000,stock_qty=8,description='Wireless laser printer. 19ppm, WiFi, mobile printing. Compact.',attributes={'type':'Laser','speed':'19ppm','wifi':'Yes','mobile_print':'Yes'}),
            dict(name='Dell 27" QHD Monitor',slug='dell-27-qhd-monitor',brand='Dell',category='computing',price=980000,stock_qty=5,description='27" QHD IPS, 75Hz, HDMI + DisplayPort, height adjustable.',attributes={'screen':'27 inches','resolution':'QHD 1440p','refresh':'75Hz','adjustable':'Height + Tilt'}),
            dict(name='Seagate 1TB External Hard Drive',slug='seagate-1tb-external',brand='Seagate',category='computing',price=185000,stock_qty=22,description='1TB USB 3.0 portable hard drive. Compatible with Windows & Mac.',attributes={'capacity':'1TB','interface':'USB 3.0','compatible':'Windows + Mac','format':'NTFS'}),
            dict(name='Kingston 16GB USB Flash Drive',slug='kingston-16gb-flash',brand='Kingston',category='computing',price=25000,stock_qty=60,description='16GB USB 3.0 flash drive. 100MB/s read speed. Cap design.',attributes={'capacity':'16GB','interface':'USB 3.0','read':'100MB/s','design':'Cap'}),
            dict(name='Sandisk 1TB SSD External',slug='sandisk-1tb-ssd-external',brand='SanDisk',category='computing',price=420000,stock_qty=12,description='1TB portable SSD, 1050MB/s read, USB 3.2, NVMe, shock resistant.',attributes={'capacity':'1TB','read':'1050MB/s','interface':'USB 3.2','shock':'Resistant'}),
            dict(name='HP Wireless Mouse and Keyboard Combo',slug='hp-wireless-combo',brand='HP',category='computing',price=95000,stock_qty=25,description='Wireless keyboard and mouse combo. 2.4GHz. Long battery life.',attributes={'connectivity':'2.4GHz Wireless','battery':'12 months','keyboard':'Full size','mouse':'Optical'}),
            dict(name='Epson L3250 EcoTank Printer',slug='epson-l3250-ecotank',brand='Epson',category='computing',price=680000,stock_qty=7,description='Print, scan, copy. WiFi, 10ml black ink bottle included. Ultra low cost per page.',attributes={'type':'Inkjet EcoTank','functions':'Print, Scan, Copy','wifi':'Yes','ink':'Bottle'}),
            dict(name='TP-Link WiFi 6 Router AX1800',slug='tp-link-wifi6-ax1800',brand='TP-Link',category='computing',price=280000,stock_qty=14,description='WiFi 6, AX1800, dual band, 4 antennas. Supports 40+ devices.',attributes={'standard':'WiFi 6 (AX1800)','band':'Dual Band','antennas':'4','devices':'40+'}),
            dict(name='Lenovo Tab M10 Plus Tablet',slug='lenovo-tab-m10-plus',brand='Lenovo',category='computing',price=780000,stock_qty=9,description='10.3" FHD, 4GB RAM, 64GB, Android 12, 5000mAh. Work and play.',attributes={'display':'10.3 inch FHD','ram':'4GB','storage':'64GB','battery':'5000mAh'}),
            dict(name='Anker 65W USB-C Charger',slug='anker-65w-usbc-charger',brand='Anker',category='computing',price=95000,stock_qty=30,description='65W GaN USB-C charger. Charges laptop, phone, tablet simultaneously.',attributes={'power':'65W GaN','ports':'USB-C + USB-A','compatible':'Laptop + Phone + Tablet','size':'Compact'}),

            # ── ELECTRONICS (20) ──────────────────────────────────────
            dict(name='Anker PowerBank 20000mAh',slug='anker-powerbank-20000',brand='Anker',category='electronics',price=150000,stock_qty=20,description='20000mAh, 22.5W fast charge, 3 outputs. Essential for load shedding.',attributes={'capacity':'20000mAh','charge':'22.5W Fast','outputs':'3','input':'USB-C + Micro'}),
            dict(name='Anker PowerBank 10000mAh',slug='anker-powerbank-10000',brand='Anker',category='electronics',price=90000,stock_qty=28,description='10000mAh slim powerbank. 18W fast charge. Fits in your pocket.',attributes={'capacity':'10000mAh','charge':'18W','outputs':'2','size':'Slim pocket'}),
            dict(name='Xiaomi 33W Fast Charger',slug='xiaomi-33w-fast-charger',brand='Xiaomi',category='electronics',price=45000,stock_qty=35,description='33W turbo USB-C charger. Compatible with all Xiaomi phones and USB-C devices.',attributes={'power':'33W','ports':'USB-C','compatible':'All USB-C','size':'Compact'}),
            dict(name='Anker USB-C to USB-C Cable 2m',slug='anker-usbc-cable-2m',brand='Anker',category='electronics',price=28000,stock_qty=50,description='2m USB-C cable. 60W power delivery. Braided nylon. Lifetime warranty.',attributes={'length':'2m','power':'60W PD','material':'Braided Nylon','warranty':'Lifetime'}),
            dict(name='Baseus 65W GaN Charger 4-Port',slug='baseus-65w-gan-4port',brand='Baseus',category='electronics',price=125000,stock_qty=18,description='65W GaN 4-port charger. 2x USB-C + 2x USB-A. Charges 4 devices at once.',attributes={'power':'65W GaN','ports':'2x USB-C + 2x USB-A','devices':'4 simultaneous','size':'Compact cube'}),
            dict(name='Ring Doorbell Camera 1080p',slug='ring-doorbell-1080p',brand='Ring',category='electronics',price=380000,stock_qty=8,description='1080p HD video doorbell. Motion detection, two-way audio, night vision.',attributes={'resolution':'1080p HD','motion':'Yes','two_way_audio':'Yes','night_vision':'Yes'}),
            dict(name='Xiaomi Mi Smart Bulb 10W',slug='xiaomi-mi-smart-bulb',brand='Xiaomi',category='electronics',price=35000,stock_qty=45,description='10W smart WiFi bulb. 16 million colours. Works with Google Home + Alexa.',attributes={'power':'10W','colors':'16 million','smart':'WiFi','compatible':'Google + Alexa'}),
            dict(name='TP-Link Smart Plug',slug='tp-link-smart-plug',brand='TP-Link',category='electronics',price=45000,stock_qty=40,description='WiFi smart plug. Schedule, voice control, energy monitoring. Works in Uganda sockets.',attributes={'wifi':'Yes','schedule':'Yes','voice':'Alexa + Google','monitoring':'Energy'}),
            dict(name='Anker SoundCore Earbuds A3i',slug='anker-soundcore-a3i',brand='Anker',category='electronics',price=85000,stock_qty=22,description='True wireless earbuds. ANC, 28hrs total battery, IPX5 waterproof, USB-C.',attributes={'anc':'Yes','battery':'28 hours total','waterproof':'IPX5','charging':'USB-C'}),
            dict(name='Samsung Galaxy Watch 4 Classic',slug='samsung-galaxy-watch4',brand='Samsung',category='electronics',price=780000,stock_qty=6,description='Rotating bezel smartwatch, body composition, ECG, sleep tracking, WearOS.',attributes={'bezel':'Rotating','health':'Body comp + ECG','os':'WearOS','battery':'40 hours'}),
            dict(name='Xiaomi Smart Band 8',slug='xiaomi-smart-band-8',brand='Xiaomi',category='electronics',price=120000,stock_qty=20,description='AMOLED display, 16-day battery, 150+ workouts, SpO2, heart rate.',attributes={'display':'AMOLED','battery':'16 days','workouts':'150+','spo2':'Yes'}),
            dict(name='Xiaomi Mi CCTV Camera 1080p',slug='xiaomi-cctv-1080p',brand='Xiaomi',category='electronics',price=95000,stock_qty=16,description='Indoor 1080p WiFi camera. 360° pan & tilt, night vision, 2-way audio.',attributes={'resolution':'1080p','pan_tilt':'360°','night_vision':'Yes','two_way_audio':'Yes'}),
            dict(name='Baseus Magnetic Wireless Charger',slug='baseus-magnetic-wireless',brand='Baseus',category='electronics',price=75000,stock_qty=24,description='15W Qi magnetic wireless charger. Compatible with iPhone + Android.',attributes={'power':'15W Qi','magnetic':'Yes','compatible':'iPhone + Android','cable':'USB-C included'}),
            dict(name='Anker 7-in-1 USB-C Hub',slug='anker-7in1-usbc-hub',brand='Anker',category='electronics',price=145000,stock_qty=14,description='7-in-1 USB-C hub. 4K HDMI, 100W PD, USB 3.0 x2, SD card reader.',attributes={'ports':'7 in 1','hdmi':'4K','pd':'100W','sd_card':'Yes'}),
            dict(name='Xiaomi Desk Lamp LED',slug='xiaomi-desk-lamp',brand='Xiaomi',category='electronics',price=68000,stock_qty=22,description='LED desk lamp, 5 colour temperatures, 5 brightness levels, USB charging port.',attributes={'led':'Yes','colour_temps':'5','brightness':'5 levels','usb_port':'Yes'}),
            dict(name='Samsung Galaxy Buds2 Pro',slug='samsung-galaxy-buds2-pro',brand='Samsung',category='electronics',price=480000,stock_qty=8,description='Hi-Fi sound, Intelligent ANC, 360 Audio, IPX7, 8 hours battery.',attributes={'anc':'Intelligent ANC','audio':'360 Audio','waterproof':'IPX7','battery':'8+29 hours'}),
            dict(name='Xiaomi Mi 65W Fast Charger Combo',slug='xiaomi-65w-combo',brand='Xiaomi',category='electronics',price=85000,stock_qty=20,description='65W GaN charger + 6A USB-C cable combo. Charges Mi laptops and phones.',attributes={'power':'65W GaN','cable':'6A USB-C included','compatible':'Mi Laptop + Phone'}),
            dict(name='Anker Nano II 45W Charger',slug='anker-nano-ii-45w',brand='Anker',category='electronics',price=75000,stock_qty=26,description='Ultra-compact 45W GaN II charger. Charges MacBook Air, iPad, iPhone.',attributes={'power':'45W GaN II','size':'Ultra-compact','compatible':'MacBook + iPad + iPhone','port':'USB-C'}),
            dict(name='Ring Smart Indoor Camera 1080p',slug='ring-indoor-camera',brand='Ring',category='electronics',price=280000,stock_qty=9,description='1080p indoor camera, privacy shutter, motion zones, works with Alexa.',attributes={'resolution':'1080p','privacy':'Shutter','motion':'Zones','alexa':'Yes'}),
            dict(name='Xiaomi Pad 6 Tablet',slug='xiaomi-pad-6',brand='Xiaomi',category='electronics',price=1250000,stock_qty=7,description='11" 144Hz 2.8K display, Snapdragon 870, 8GB RAM, 8840mAh. MIUI 14.',attributes={'display':'11" 144Hz 2.8K','chip':'Snapdragon 870','ram':'8GB','battery':'8840mAh'}),

            # ── FASHION (20) ──────────────────────────────────────────
            dict(name='Ankara Print Wrap Dress Women',slug='ankara-wrap-dress-women',brand='AfriWear',category='fashion',price=95000,stock_qty=20,description='Premium Ankara fabric wrap dress. Vibrant African print. Sizes XS–3XL.',attributes={'sizes':'XS–3XL','material':'Ankara Cotton','style':'Wrap','occasion':'Casual + Office'}),
            dict(name='Men\'s Linen Blazer Slim Fit',slug='mens-linen-blazer-slim',brand='UrbanUG',category='fashion',price=185000,stock_qty=14,description='Lightweight linen blazer. Perfect for Kampala office weather. Slim fit.',attributes={'sizes':'S–3XL','material':'Linen blend','fit':'Slim','colour':'Navy + Beige + Grey'}),
            dict(name='Women\'s High Waist Denim Jeans',slug='womens-high-waist-jeans',brand='DenimUG',category='fashion',price=85000,stock_qty=25,description='Stretch denim high waist jeans. 5-pocket design. Runs true to size.',attributes={'sizes':'26–42','material':'98% Cotton 2% Elastane','fit':'High waist','pockets':'5'}),
            dict(name='Men\'s Cargo Pants',slug='mens-cargo-pants',brand='UrbanUG',category='fashion',price=75000,stock_qty=30,description='Heavy-duty cargo pants, 6 pockets, belt loops, reinforced knees.',attributes={'sizes':'28–42','material':'Cotton twill','pockets':'6','style':'Cargo'}),
            dict(name='Kitenge Pencil Skirt Women',slug='kitenge-pencil-skirt',brand='AfriWear',category='fashion',price=65000,stock_qty=22,description='Bold Kitenge fabric pencil skirt. Below-knee length. Office appropriate.',attributes={'sizes':'XS–2XL','material':'Kitenge','length':'Below knee','occasion':'Office + Event'}),
            dict(name='Men\'s African Print Shirt',slug='mens-african-print-shirt',brand='AfriWear',category='fashion',price=75000,stock_qty=18,description='Kente-inspired short sleeve shirt. Slim fit. Bold African patterns.',attributes={'sizes':'S–3XL','material':'Cotton','fit':'Slim','sleeve':'Short'}),
            dict(name='Women\'s Office Blazer Set',slug='womens-office-blazer-set',brand='ProfessionalUG',category='fashion',price=220000,stock_qty=10,description='Blazer + trouser set. Formal office wear. Wrinkle resistant fabric.',attributes={'sizes':'XS–2XL','includes':'Blazer + Trousers','material':'Polyester blend','occasion':'Office + Formal'}),
            dict(name='Men\'s White Dress Shirt',slug='mens-white-dress-shirt',brand='ClassicUG',category='fashion',price=55000,stock_qty=35,description='100% cotton white dress shirt. Regular fit. Reinforced buttons.',attributes={'sizes':'S–4XL','material':'100% Cotton','fit':'Regular','colour':'White'}),
            dict(name='Women\'s Maxi Ankara Gown',slug='womens-maxi-ankara-gown',brand='AfriWear',category='fashion',price=145000,stock_qty=14,description='Floor-length Ankara gown. Elegant occasion wear. Side zip.',attributes={'sizes':'XS–3XL','material':'Ankara','length':'Floor length','occasion':'Events + Weddings'}),
            dict(name='Men\'s Slim Fit Chinos',slug='mens-slim-fit-chinos',brand='UrbanUG',category='fashion',price=72000,stock_qty=28,description='Cotton slim fit chinos. 5-pocket. Belt loops. Multiple colours.',attributes={'sizes':'28–40','material':'98% Cotton','fit':'Slim','colours':'Khaki, Navy, Olive, Black'}),
            dict(name='Women\'s Sports Leggings',slug='womens-sports-leggings',brand='ActiveUG',category='fashion',price=58000,stock_qty=30,description='High-waist sports leggings. Moisture wicking. 4-way stretch.',attributes={'sizes':'XS–2XL','material':'Nylon + Spandex','waist':'High','function':'Moisture wicking'}),
            dict(name='Men\'s Track Suit 2pc',slug='mens-track-suit-2pc',brand='ActiveUG',category='fashion',price=98000,stock_qty=16,description='Matching track jacket + jogger pants. Breathable polyester.',attributes={'sizes':'S–3XL','includes':'Jacket + Jogger','material':'Polyester','closure':'Zip jacket'}),
            dict(name='Women\'s Kente Print Jumpsuit',slug='womens-kente-jumpsuit',brand='AfriWear',category='fashion',price=125000,stock_qty=12,description='Wide-leg Kente print jumpsuit. Pockets included. Statement piece.',attributes={'sizes':'XS–2XL','material':'Kente Cotton','pockets':'Yes','fit':'Wide leg'}),
            dict(name='Men\'s Leather Belt',slug='mens-leather-belt',brand='ClassicUG',category='fashion',price=45000,stock_qty=40,description='Genuine leather belt. Reversible black/brown. Sizes 28–46.',attributes={'sizes':'28–46','material':'Genuine Leather','reversible':'Black + Brown','buckle':'Silver'}),
            dict(name='Women\'s Platform Heels',slug='womens-platform-heels',brand='StyleUG',category='fashion',price=115000,stock_qty=16,description='Platform block heels. 3.5 inch height. Ankle strap. Multiple colours.',attributes={'sizes':'36–42','heel':'3.5 inches Platform','strap':'Ankle','colours':'Black, Nude, Red'}),
            dict(name='Men\'s Leather Oxford Shoes',slug='mens-leather-oxford-shoes',brand='ClassicUG',category='fashion',price=185000,stock_qty=12,description='Genuine leather oxford shoes. Lace-up. Rubber sole. Office + formal.',attributes={'sizes':'39–46','material':'Genuine Leather','sole':'Rubber','occasion':'Office + Formal'}),
            dict(name='Women\'s Handbag Tote Leather',slug='womens-tote-handbag',brand='StyleUG',category='fashion',price=145000,stock_qty=14,description='PU leather tote bag. Zipper + magnetic closure. Laptop compartment.',attributes={'material':'PU Leather','closure':'Zipper + Magnetic','laptop':'Yes','colours':'Black, Brown, Tan'}),
            dict(name='Men\'s Wrist Watch Stainless',slug='mens-wristwatch-stainless',brand='TimePiece',category='fashion',price=185000,stock_qty=10,description='Stainless steel quartz watch. 30m water resistant. Date display.',attributes={'material':'Stainless Steel','movement':'Quartz','water_resist':'30m','display':'Date'}),
            dict(name='Women\'s Silk Head Scarf',slug='womens-silk-head-scarf',brand='AfriWear',category='fashion',price=35000,stock_qty=45,description='100% silk head scarf. African Kente and Ankara prints. 90x90cm.',attributes={'material':'100% Silk','size':'90x90cm','prints':'Kente + Ankara','occasions':'Daily + Special'}),
            dict(name='Men\'s Short Sleeve Polo Shirt',slug='mens-polo-shirt',brand='UrbanUG',category='fashion',price=55000,stock_qty=35,description='100% cotton polo shirt. Slim fit. Ribbed collar. Multiple colours.',attributes={'sizes':'S–3XL','material':'100% Cotton','fit':'Slim','colours':'White, Navy, Red, Black, Green'}),

            # ── HOME & LIVING (20) ────────────────────────────────────
            dict(name='Intex Queen Air Mattress with Pump',slug='intex-queen-air-mattress',brand='Intex',category='home-living',price=185000,stock_qty=10,description='Queen size inflatable air mattress. Built-in electric pump. 50-second inflation.',attributes={'size':'Queen (152x203cm)','pump':'Built-in electric','inflation':'50 seconds','weight_limit':'272kg'}),
            dict(name='ARIS 6-Piece Towel Set',slug='aris-6-piece-towel-set',brand='ARIS',category='home-living',price=125000,stock_qty=18,description='100% cotton towel set. 2 bath + 2 hand + 2 face towels. Quick dry.',attributes={'pieces':'6','material':'100% Cotton','includes':'Bath + Hand + Face','function':'Quick dry'}),
            dict(name='Intex Swimming Pool 305cm',slug='intex-swimming-pool-305cm',brand='Intex',category='home-living',price=280000,stock_qty=6,description='305cm round family pool. Includes filter pump, ground cloth & cover.',attributes={'size':'305x76cm','includes':'Filter pump + Ground cloth + Cover','capacity':'3638L'}),
            dict(name='Royalford Bed Sheet Set King',slug='royalford-bed-sheet-king',brand='Royalford',category='home-living',price=95000,stock_qty=22,description='180TC cotton blend king bed sheet set. Includes flat, fitted, 2 pillowcases.',attributes={'size':'King','tc':'180 Thread Count','material':'Cotton blend','includes':'4 pieces'}),
            dict(name='Geepas Tower Fan 45W',slug='geepas-tower-fan',brand='Geepas',category='home-living',price=185000,stock_qty=8,description='45W oscillating tower fan. Remote control, 12-hour timer, 3 speeds.',attributes={'power':'45W','oscillation':'Yes','timer':'12 hours','speeds':'3','remote':'Yes'}),
            dict(name='Midea Standing Fan 16"',slug='midea-standing-fan-16',brand='Midea',category='home-living',price=125000,stock_qty=14,description='16" standing fan. 3 speeds, adjustable height, oscillating. Quiet motor.',attributes={'blade':'16 inches','speeds':'3','height':'Adjustable','oscillation':'Yes'}),
            dict(name='Decorative Throw Pillow Set 4pc',slug='throw-pillow-set-4pc',brand='HomeDecor',category='home-living',price=85000,stock_qty=20,description='Set of 4 decorative throw pillows. African-inspired patterns. 45x45cm.',attributes={'pieces':'4','size':'45x45cm','fill':'Fibre','style':'African patterns'}),
            dict(name='ARIS Kitchen Curtains 2 Panels',slug='aris-kitchen-curtains',brand='ARIS',category='home-living',price=65000,stock_qty=25,description='2 blackout curtain panels. Rod pocket. Machine washable. Multiple colours.',attributes={'panels':'2','type':'Blackout','hanging':'Rod pocket','washable':'Machine wash'}),
            dict(name='Royalford Foam Mattress 6" Single',slug='royalford-foam-mattress-single',brand='Royalford',category='home-living',price=285000,stock_qty=8,description='6" high density foam mattress. Single size. Medium firmness. Breathable cover.',attributes={'size':'Single (90x190cm)','depth':'6 inches','density':'High','firmness':'Medium'}),
            dict(name='Decorative Floor Rug 160x230cm',slug='decorative-floor-rug',brand='HomeDecor',category='home-living',price=185000,stock_qty=10,description='Large area rug. Geometric African print. Non-slip backing. Easy to clean.',attributes={'size':'160x230cm','print':'Geometric African','backing':'Non-slip','care':'Easy clean'}),
            dict(name='Intex Inflatable Sofa Chair',slug='intex-inflatable-sofa',brand='Intex',category='home-living',price=145000,stock_qty=12,description='Flock top inflatable sofa. Velvet-like surface. Holds up to 120kg.',attributes={'type':'Inflatable sofa','surface':'Flock velvet','weight_limit':'120kg','color':'Blue + Green'}),
            dict(name='Geepas Ceramic Heater 2000W',slug='geepas-ceramic-heater',brand='Geepas',category='home-living',price=165000,stock_qty=9,description='2000W ceramic space heater. 2 heat settings, cool fan mode, overheat protection.',attributes={'power':'2000W','settings':'2 heat + fan cool','protection':'Overheat + tip-over','timer':'Yes'}),
            dict(name='ARIS 3-Piece Bathroom Set',slug='aris-bathroom-set',brand='ARIS',category='home-living',price=75000,stock_qty=18,description='Soap dispenser, tumbler and soap dish. Resin material. Modern design.',attributes={'pieces':'3','includes':'Dispenser + Tumbler + Soap dish','material':'Resin','style':'Modern'}),
            dict(name='Royalford Wall Clock 30cm',slug='royalford-wall-clock',brand='Royalford',category='home-living',price=45000,stock_qty=30,description='30cm silent wall clock. Sweep movement — no ticking sound. Batteries included.',attributes={'size':'30cm','movement':'Silent sweep','batteries':'Included','material':'Plastic'}),
            dict(name='HomeDecor LED Fairy Lights 10m',slug='led-fairy-lights-10m',brand='HomeDecor',category='home-living',price=35000,stock_qty=40,description='10m string of 100 LED fairy lights. Warm white. USB powered. 8 modes.',attributes={'length':'10m','leds':'100','color':'Warm white','modes':'8','power':'USB'}),
            dict(name='Foam Mattress 6" Double',slug='foam-mattress-6-double',brand='Royalford',category='home-living',price=420000,stock_qty=6,description='6" high density double mattress. Medium firmness. Knitted cover.',attributes={'size':'Double (120x190cm)','depth':'6 inches','cover':'Knitted','firmness':'Medium'}),
            dict(name='Geepas Air Purifier HEPA',slug='geepas-air-purifier',brand='Geepas',category='home-living',price=285000,stock_qty=7,description='HEPA + carbon air purifier. 3-stage filtration, 3 fan speeds, 40m² coverage.',attributes={'filter':'HEPA + Carbon','stages':'3','speeds':'3','coverage':'40m²'}),
            dict(name='ARIS Laundry Basket Woven',slug='aris-laundry-basket',brand='ARIS',category='home-living',price=55000,stock_qty=22,description='Woven laundry basket with lid. Fabric lining. 60L capacity.',attributes={'capacity':'60L','material':'Woven','lid':'Yes','lining':'Fabric'}),
            dict(name='HomeDecor Photo Frame Set 5pc',slug='photo-frame-set-5pc',brand='HomeDecor',category='home-living',price=75000,stock_qty=20,description='Set of 5 photo frames. Mixed sizes 4x6, 5x7, 8x10. Wall or tabletop.',attributes={'pieces':'5','sizes':'4x6 + 5x7 + 8x10','display':'Wall + Tabletop','material':'MDF + Glass'}),
            dict(name='Intex Solar Powered Pool',slug='intex-solar-powered-pool',brand='Intex',category='home-living',price=380000,stock_qty=4,description='244cm round pool with solar-powered filter pump. Eco-friendly.',attributes={'size':'244x76cm','pump':'Solar powered','eco':'Yes','includes':'Cover + Ground cloth'}),
        ]

        from products.models import Category, Product
        created = 0
        for data in ALL_PRODUCTS:
            d = dict(data)  # copy so pop doesn't mutate original
            cat_slug = d.pop('category')
            category = Category.objects.filter(slug=cat_slug).first()
            if not category:
                self.stdout.write(f'  WARNING: category not found: {cat_slug}')
                continue
            obj, made = Product.objects.get_or_create(
                slug=d['slug'],
                defaults={**d, 'category': category, 'is_active': True, 'images': []}
            )
            if not made:
                # Update category in case it was wrong
                obj.category = category
                obj.save()
            if made:
                created += 1

        self.stdout.write(f'  + {created} products seeded')

    def seed_promotion(self):
        from promotions.views import Promotion
        now = timezone.now()
        promo, created = Promotion.objects.get_or_create(
            name='Weekend Flash Sale',
            defaults={
                'promo_type':    'flash_sale',
                'status':        'live',
                'discount_pct':  Decimal('15.00'),
                'applies_to':    'all',
                'starts_at':     now,
                'ends_at':       now + timedelta(hours=48),
                'target_orders': 100,
            }
        )
        if created:
            self.stdout.write('  + Flash sale promotion created (15% off everything, 48hrs)')
            try:
                from promotions.views import _apply_promo_prices
                _apply_promo_prices(promo)
            except Exception:
                pass
