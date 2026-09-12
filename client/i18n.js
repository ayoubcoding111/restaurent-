// ============================================
// I18n — English / French / Arabic (+ RTL)
// Static strings via data-i18n / data-i18n-ph attributes.
// Dynamic templates use I18n.t(key).
// Language switch reloads the page so every view re-renders.
// ============================================
const I18n = {
    LANG_KEY: 'app_lang',

    dict: {
        en: {
            nav_home: 'Home', nav_menu: 'Menu', nav_contact: 'Contact', nav_cart: 'Cart',
            hero_title: 'Welcome to Delicious Restaurant',
            hero_sub: 'Experience the finest flavors in town',
            hero_cta: 'View Menu',
            hours_t: 'Opening Hours',
            hours_wd: 'Monday - Friday: 11:00 AM - 10:00 PM',
            hours_we: 'Saturday - Sunday: 12:00 PM - 11:00 PM',
            call_t: 'Call to Order',
            call_sub: 'Call us directly to place your order!',
            loc_t: 'Location',
            menu_title: 'Our Menu',
            search_ph: 'Search menu items...',
            f_all: 'All', f_pizzas: 'Pizzas', f_tacos: 'Tacos', f_drinks: 'Drinks', f_family: 'Family Pack',
            load_more: 'Load More', remaining: 'remaining',
            contact_title: 'Contact Us',
            cart_title: 'My Cart', cart_total: 'Total:',
            cart_empty: 'Your cart is empty.', cart_browse: 'Browse the menu',
            order_now_btn: 'Order Now', clear_cart: 'Clear Cart',
            thanks_title: 'Order Placed!',
            thanks_text: "Your order has been placed. We'll call you back shortly to confirm!",
            back_menu: 'Back to Menu',
            nav_track: 'Track',
            track_this_order: 'Track this order',
            track_title: 'Track Your Order',
            track_sub: 'Enter your order number and phone to see live status.',
            track_id: 'Order number *',
            track_phone: 'Mobile Number *',
            track_btn: 'Track Order',
            track_not_found: 'Order not found. Check order number and phone.',
            track_failed: 'Could not track order. Please try again.',
            track_order: 'Order',
            track_for: 'For',
            track_auto: 'Auto-refreshes every 30s while this tab is visible.',
            login_rate: 'Too many attempts. Try again in 15 minutes.',
            login_banned: 'Too many attempts. Your IP is temporarily blocked. Try again later.',
            staff_title: 'Order Management',
            admin_title: 'Admin Dashboard',
            tab_staff: 'Staff', tab_orders: 'Orders', tab_menu: 'Menu Items', tab_analytics: 'Analytics',
            tab_account: 'My Account',
            edit_staff_t: 'Edit Staff Account',
            new_pass_opt: 'New Password (leave blank to keep)',
            save_btn: 'Save Changes', cancel_btn: 'Cancel',
            delete_btn: 'Delete', confirm_title: 'Please confirm',
            my_profile_t: 'My Profile', change_pass_t: 'Change Password',
            cur_pass: 'Current Password', update_profile_btn: 'Update Profile',
            foot_contact: 'Contact Us', foot_links: 'Quick Links', foot_dev: 'Developed By',
            rights: 'All rights reserved.',
            login_title: 'Staff / Admin Login',
            login_user: 'Username or Email', login_user_ph: 'e.g. admin or you@example.com',
            login_pass: 'Password', login_btn: 'Login',
            login_bad: 'Incorrect username/email or password.',
            dev_open: 'Open reset link (dev only)',
            forgot_link: 'Forgot password?',
            fp_title: 'Reset Password',
            fp_sub: "Enter your account email or username and we'll send you a reset link.",
            fp_field: 'Email or Username', fp_btn: 'Send Reset Link',
            back_login: '← Back to login',
            rp_title: 'Choose a New Password',
            rp_new: 'New Password (min 6 characters)', rp_confirm: 'Confirm New Password',
            rp_btn: 'Reset Password',
            co_title: 'Complete Your Order',
            co_sub: 'Fill in your details to place your order.',
            co_name: 'Full Name *', co_phone: 'Mobile Number *', co_addr: 'Address *',
            co_btn: 'Place Order',
            co_phone_hint: 'Algerian mobile: 05 / 06 / 07 or +213…',
            phone_invalid: 'Invalid phone number. Use 05/06/07 (10 digits) or +213…',
            fill_all: 'Please fill in all fields.',
            order_failed: 'Failed to place order. Please try again.',
            copied: 'Phone number copied.',
            copy_failed: 'Could not copy. Please copy it manually.',
            copy_phone: 'Click to copy phone number',
            add_staff_t: 'Add New Staff',
            u_name: 'Username *', u_email: 'Email *', u_pass: 'Password *', u_full: 'Full Name *',
            u_role: 'Role', r_staff: 'Staff', r_admin: 'Admin', create_acc: 'Create Account',
            add_item_t: 'Add Menu Item',
            i_name: 'Name *', i_price: 'Price ($) *', i_cat: 'Category *', i_select: 'Select',
            i_desc: 'Description', i_desc_ph: 'A short description of the item...',
            i_img: 'Image *', add_item_btn: 'Add Item',
            avail: '✓ Available', unavail: '✗ Not Available',
            add_cart: 'Add to Cart', order_now: 'Order Now',
            edit_item_t: 'Edit Menu Item', edit_btn: 'Edit', customize: 'Customize',
            opts_t: 'Customization options',
            opts_hint: 'Group options (e.g. "Extra ingredients", "Size"). "Single" = customer picks one (sizes), "Multiple" = can pick several (ingredients). Each adds its price.',
            opt_group: 'Group', opt_name: 'Option', opt_price: '+Price ($)',
            opt_type: 'Type', opt_single: 'Single', opt_multi: 'Multiple',
            add_option: '+ Add option',
            change_image: 'Change image (optional)',
            offline_err: 'You are offline. Reconnect to place your order.',
            reviews_t: 'Reviews', loading_reviews: 'Loading reviews...',
            no_reviews: 'No reviews yet. Be the first!',
            your_name: 'Your name', your_comment: 'Write a comment (optional)',
            submit_review: 'Submit Review',
            review_ok: 'Thanks! Your review was sent for moderation.',
            review_bad: 'Could not submit review.',
            tab_reviews: 'Reviews', tab_zones: 'Zones',
            zone_label: 'Delivery zone', delivery_fee: 'Delivery', subtotal: 'Subtotal',
            free_delivery: 'Free delivery!', no_zones: 'No delivery zones',
            add_zone_t: 'Add Delivery Zone',
            z_name: 'Name *', z_fee: 'Fee ($) *', z_free: 'Free over ($, optional)',
            z_eta: 'ETA (min)', add_zone_btn: 'Add Zone',
            st_pending: 'Pending', st_confirmed: 'Confirmed', st_preparing: 'Preparing',
            st_ready: 'Ready', st_on_way: 'On the way', st_delivered: 'Delivered',
            free_over: 'free over', min_unit: 'min',
            z_no_free: 'No free delivery', z_fee_label: 'Fee',
            active_on: 'active', active_off: 'off',
            enable_btn: 'Enable', disable_btn: 'Disable',
            approve_btn: 'Approve', hide_btn: 'Hide',
            assigned_label: 'Assigned', unassigned: 'Unassigned'
        },
        fr: {
            nav_home: 'Accueil', nav_menu: 'Menu', nav_contact: 'Contact', nav_cart: 'Panier',
            hero_title: 'Bienvenue au Restaurant Delicious',
            hero_sub: 'Découvrez les meilleures saveurs de la ville',
            hero_cta: 'Voir le Menu',
            hours_t: "Horaires d'ouverture",
            hours_wd: 'Lundi - Vendredi : 11h00 - 22h00',
            hours_we: 'Samedi - Dimanche : 12h00 - 23h00',
            call_t: 'Commander par Téléphone',
            call_sub: 'Appelez-nous directement pour commander !',
            loc_t: 'Adresse',
            menu_title: 'Notre Menu',
            search_ph: 'Rechercher un plat...',
            f_all: 'Tout', f_pizzas: 'Pizzas', f_tacos: 'Tacos', f_drinks: 'Boissons', f_family: 'Pack Familial',
            load_more: 'Afficher plus', remaining: 'restants',
            contact_title: 'Contactez-nous',
            cart_title: 'Mon Panier', cart_total: 'Total :',
            cart_empty: 'Votre panier est vide.', cart_browse: 'Voir le menu',
            order_now_btn: 'Commander', clear_cart: 'Vider le panier',
            thanks_title: 'Commande envoyée !',
            thanks_text: 'Votre commande a été enregistrée. Nous vous appellerons bientôt pour confirmer !',
            back_menu: 'Retour au Menu',
            nav_track: 'Suivi',
            track_this_order: 'Suivre ma commande',
            track_title: 'Suivre votre commande',
            track_sub: 'Entrez votre numéro de commande et votre téléphone pour voir le statut.',
            track_id: 'Numéro de commande *',
            track_phone: 'Numéro de mobile *',
            track_btn: 'Suivre',
            track_not_found: 'Commande introuvable. Vérifiez le numéro et le téléphone.',
            track_failed: 'Suivi impossible. Veuillez réessayer.',
            track_order: 'Commande',
            track_for: 'Pour',
            track_auto: 'Actualisation auto toutes les 30 s quand cet onglet est visible.',
            login_rate: 'Trop de tentatives. Réessayez dans 15 minutes.',
            login_banned: 'Trop de tentatives. Votre IP est temporairement bloquée. Réessayez plus tard.',
            staff_title: 'Gestion des Commandes',
            admin_title: 'Tableau de Bord Admin',
            tab_staff: 'Personnel', tab_orders: 'Commandes', tab_menu: 'Plats', tab_analytics: 'Statistiques',
            tab_account: 'Mon compte',
            edit_staff_t: 'Modifier le compte',
            new_pass_opt: 'Nouveau mot de passe (vide = inchangé)',
            save_btn: 'Enregistrer', cancel_btn: 'Annuler',
            delete_btn: 'Supprimer', confirm_title: 'Veuillez confirmer',
            my_profile_t: 'Mon profil', change_pass_t: 'Changer le mot de passe',
            cur_pass: 'Mot de passe actuel', update_profile_btn: 'Mettre à jour',
            foot_contact: 'Contactez-nous', foot_links: 'Liens rapides', foot_dev: 'Développé par',
            rights: 'Tous droits réservés.',
            login_title: 'Connexion Personnel / Admin',
            login_user: "Nom d'utilisateur ou Email", login_user_ph: 'ex. admin ou vous@exemple.com',
            login_pass: 'Mot de passe', login_btn: 'Se connecter',
            login_bad: 'Nom d\'utilisateur/email ou mot de passe incorrect.',
            dev_open: 'Ouvrir le lien (dev uniquement)',
            forgot_link: 'Mot de passe oublié ?',
            fp_title: 'Réinitialiser le mot de passe',
            fp_sub: 'Entrez votre email ou nom d\'utilisateur pour recevoir un lien.',
            fp_field: 'Email ou Nom d\'utilisateur', fp_btn: 'Envoyer le lien',
            back_login: '← Retour à la connexion',
            rp_title: 'Choisir un nouveau mot de passe',
            rp_new: 'Nouveau mot de passe (min 6 caractères)', rp_confirm: 'Confirmer le mot de passe',
            rp_btn: 'Réinitialiser',
            co_title: 'Finaliser votre commande',
            co_sub: 'Remplissez vos informations pour passer votre commande.',
            co_name: 'Nom complet *', co_phone: 'Numéro de mobile *', co_addr: 'Adresse *',
            co_btn: 'Commander',
            co_phone_hint: 'Mobile algérien : 05 / 06 / 07 ou +213…',
            phone_invalid: 'Numéro invalide. Utilisez 05/06/07 (10 chiffres) ou +213…',
            fill_all: 'Veuillez remplir tous les champs.',
            order_failed: 'Échec de la commande. Veuillez réessayer.',
            copied: 'Numéro copié.',
            copy_failed: 'Copie impossible. Copiez-le manuellement.',
            copy_phone: 'Cliquer pour copier le numéro',
            add_staff_t: 'Ajouter un employé',
            u_name: "Nom d'utilisateur *", u_email: 'Email *', u_pass: 'Mot de passe *', u_full: 'Nom complet *',
            u_role: 'Rôle', r_staff: 'Employé', r_admin: 'Admin', create_acc: 'Créer le compte',
            add_item_t: 'Ajouter un plat',
            i_name: 'Nom *', i_price: 'Prix ($) *', i_cat: 'Catégorie *', i_select: 'Choisir',
            i_desc: 'Description', i_desc_ph: 'Une courte description du plat...',
            i_img: 'Image *', add_item_btn: 'Ajouter',
            avail: '✓ Disponible', unavail: '✗ Indisponible',
            add_cart: 'Ajouter', order_now: 'Commander',
            edit_item_t: 'Modifier le plat', edit_btn: 'Modifier', customize: 'Personnaliser',
            opts_t: 'Options de personnalisation',
            opts_hint: 'Regroupez les options (ex. « Suppléments », « Taille »). « Unique » = un seul choix (tailles), « Multiple » = plusieurs choix (ingrédients). Chacune ajoute son prix.',
            opt_group: 'Groupe', opt_name: 'Option', opt_price: '+Prix ($)',
            opt_type: 'Type', opt_single: 'Unique', opt_multi: 'Multiple',
            add_option: '+ Ajouter une option',
            change_image: 'Changer l\'image (optionnel)',
            offline_err: 'Vous êtes hors ligne. Reconnectez-vous pour commander.',
            reviews_t: 'Avis', loading_reviews: 'Chargement des avis...',
            no_reviews: 'Aucun avis. Soyez le premier !',
            your_name: 'Votre nom', your_comment: 'Écrivez un commentaire (optionnel)',
            submit_review: 'Envoyer',
            review_ok: 'Merci ! Votre avis a été envoyé pour modération.',
            review_bad: 'Impossible d\'envoyer l\'avis.',
            tab_reviews: 'Avis', tab_zones: 'Zones',
            zone_label: 'Zone de livraison', delivery_fee: 'Livraison', subtotal: 'Sous-total',
            free_delivery: 'Livraison gratuite !', no_zones: 'Aucune zone',
            add_zone_t: 'Ajouter une zone',
            z_name: 'Nom *', z_fee: 'Frais ($) *', z_free: 'Gratuit dès ($, optionnel)',
            z_eta: 'Délai (min)', add_zone_btn: 'Ajouter',
            st_pending: 'En attente', st_confirmed: 'Confirmée', st_preparing: 'En préparation',
            st_ready: 'Prête', st_on_way: 'En route', st_delivered: 'Livrée',
            free_over: 'gratuit dès', min_unit: 'min',
            z_no_free: 'Pas de livraison gratuite', z_fee_label: 'Frais',
            active_on: 'actif', active_off: 'inactif',
            enable_btn: 'Activer', disable_btn: 'Désactiver',
            approve_btn: 'Approuver', hide_btn: 'Masquer',
            assigned_label: 'Assigné', unassigned: 'Non assigné'
        },
        ar: {
            nav_home: 'الرئيسية', nav_menu: 'القائمة', nav_contact: 'اتصل بنا', nav_cart: 'السلة',
            hero_title: 'مرحباً بكم في مطعم Delicious',
            hero_sub: 'استمتع بأشهى النكهات في المدينة',
            hero_cta: 'عرض القائمة',
            hours_t: 'ساعات العمل',
            hours_wd: 'الاثنين - الجمعة: 11:00 صباحاً - 10:00 مساءً',
            hours_we: 'السبت - الأحد: 12:00 ظهراً - 11:00 مساءً',
            call_t: 'اتصل للطلب',
            call_sub: 'اتصل بنا مباشرة لطلب طعامك!',
            loc_t: 'الموقع',
            menu_title: 'قائمتنا',
            search_ph: 'ابحث في القائمة...',
            f_all: 'الكل', f_pizzas: 'بيتزا', f_tacos: 'طاكوس', f_drinks: 'مشروبات', f_family: 'علبة عائلية',
            load_more: 'عرض المزيد', remaining: 'متبقٍ',
            contact_title: 'اتصل بنا',
            cart_title: 'سلة التسوق', cart_total: 'المجموع:',
            cart_empty: 'سلة التسوق فارغة.', cart_browse: 'تصفح القائمة',
            order_now_btn: 'اطلب الآن', clear_cart: 'إفراغ السلة',
            thanks_title: 'تم استلام طلبك!',
            thanks_text: 'تم تسجيل طلبك. سنتصل بك قريباً للتأكيد!',
            back_menu: 'العودة إلى القائمة',
            nav_track: 'تتبع',
            track_this_order: 'تتبع طلبي',
            track_title: 'تتبع طلبك',
            track_sub: 'أدخل رقم الطلب ورقم الهاتف لرؤية الحالة مباشرة.',
            track_id: 'رقم الطلب *',
            track_phone: 'رقم الهاتف *',
            track_btn: 'تتبع الطلب',
            track_not_found: 'لم يتم العثور على الطلب. تحقق من الرقم والهاتف.',
            track_failed: 'تعذر تتبع الطلب. حاول مجدداً.',
            track_order: 'الطلب',
            track_for: 'باسم',
            track_auto: 'يتحدث تلقائياً كل 30 ثانية عندما يكون هذا التبويب مرئياً.',
            login_rate: 'محاولات كثيرة. حاول مجدداً بعد 15 دقيقة.',
            login_banned: 'محاولات كثيرة. تم حظر عنوان IP مؤقتاً. حاول لاحقاً.',
            staff_title: 'إدارة الطلبات',
            admin_title: 'لوحة الإدارة',
            tab_staff: 'الموظفون', tab_orders: 'الطلبات', tab_menu: 'عناصر القائمة', tab_analytics: 'الإحصائيات',
            tab_account: 'حسابي',
            edit_staff_t: 'تعديل حساب الموظف',
            new_pass_opt: 'كلمة مرور جديدة (اتركها فارغة للإبقاء)',
            save_btn: 'حفظ التغييرات', cancel_btn: 'إلغاء',
            delete_btn: 'حذف', confirm_title: 'يرجى التأكيد',
            my_profile_t: 'حسابي', change_pass_t: 'تغيير كلمة المرور',
            cur_pass: 'كلمة المرور الحالية', update_profile_btn: 'تحديث الحساب',
            foot_contact: 'اتصل بنا', foot_links: 'روابط سريعة', foot_dev: 'طُوّر بواسطة',
            rights: 'جميع الحقوق محفوظة.',
            login_title: 'تسجيل دخول الموظفين / الإدارة',
            login_user: 'اسم المستخدم أو البريد الإلكتروني', login_user_ph: 'مثال: admin أو you@example.com',
            login_pass: 'كلمة المرور', login_btn: 'تسجيل الدخول',
            login_bad: 'اسم المستخدم/البريد أو كلمة المرور غير صحيحة.',
            dev_open: 'فتح رابط التعيين (وضع التطوير)',
            forgot_link: 'نسيت كلمة المرور؟',
            fp_title: 'إعادة تعيين كلمة المرور',
            fp_sub: 'أدخل بريدك الإلكتروني أو اسم المستخدم وسنرسل لك رابط التعيين.',
            fp_field: 'البريد الإلكتروني أو اسم المستخدم', fp_btn: 'إرسال رابط التعيين',
            back_login: '← العودة لتسجيل الدخول',
            rp_title: 'اختر كلمة مرور جديدة',
            rp_new: 'كلمة المرور الجديدة (6 أحرف على الأقل)', rp_confirm: 'تأكيد كلمة المرور الجديدة',
            rp_btn: 'إعادة التعيين',
            co_title: 'أكمل طلبك',
            co_sub: 'املأ بياناتك لتسجيل طلبك.',
            co_name: 'الاسم الكامل *', co_phone: 'رقم الهاتف *', co_addr: 'العنوان *',
            co_btn: 'تأكيد الطلب',
            co_phone_hint: 'هاتف جزائري: 05 / 06 / 07 أو +213…',
            phone_invalid: 'رقم هاتف غير صالح. استخدم 05/06/07 (10 أرقام) أو +213…',
            fill_all: 'يرجى ملء جميع الحقول.',
            order_failed: 'فشل تسجيل الطلب. حاول مجدداً.',
            copied: 'تم نسخ رقم الهاتف.',
            copy_failed: 'تعذر النسخ. انسخه يدوياً.',
            copy_phone: 'انقر لنسخ رقم الهاتف',
            add_staff_t: 'إضافة موظف جديد',
            u_name: 'اسم المستخدم *', u_email: 'البريد الإلكتروني *', u_pass: 'كلمة المرور *', u_full: 'الاسم الكامل *',
            u_role: 'الدور', r_staff: 'موظف', r_admin: 'مدير', create_acc: 'إنشاء الحساب',
            add_item_t: 'إضافة عنصر للقائمة',
            i_name: 'الاسم *', i_price: 'السعر ($) *', i_cat: 'الفئة *', i_select: 'اختر',
            i_desc: 'الوصف', i_desc_ph: 'وصف قصير للعنصر...',
            i_img: 'الصورة *', add_item_btn: 'إضافة العنصر',
            avail: '✓ متوفر', unavail: '✗ غير متوفر',
            add_cart: 'أضف إلى السلة', order_now: 'اطلب الآن',
            edit_item_t: 'تعديل عنصر القائمة', edit_btn: 'تعديل', customize: 'تخصيص',
            opts_t: 'خيارات التخصيص',
            opts_hint: 'جمّع الخيارات (مثل "إضافات"، "الحجم"). "واحد" = اختيار واحد (الأحجام)، "متعدد" = عدة اختيارات (المكونات). كل خيار يضيف سعره.',
            opt_group: 'المجموعة', opt_name: 'الخيار', opt_price: '+السعر ($)',
            opt_type: 'النوع', opt_single: 'واحد', opt_multi: 'متعدد',
            add_option: '+ إضافة خيار',
            change_image: 'تغيير الصورة (اختياري)',
            offline_err: 'أنت غير متصل. أعد الاتصال لتسجيل طلبك.',
            reviews_t: 'التقييمات', loading_reviews: 'جارٍ تحميل التقييمات...',
            no_reviews: 'لا توجد تقييمات بعد. كن أول من يقيّم!',
            your_name: 'اسمك', your_comment: 'اكتب تعليقاً (اختياري)',
            submit_review: 'إرسال التقييم',
            review_ok: 'شكراً! تم إرسال تقييمك للمراجعة.',
            review_bad: 'تعذر إرسال التقييم.',
            tab_reviews: 'التقييمات', tab_zones: 'المناطق',
            zone_label: 'منطقة التوصيل', delivery_fee: 'التوصيل', subtotal: 'المجموع الفرعي',
            free_delivery: 'توصيل مجاني!', no_zones: 'لا توجد مناطق',
            add_zone_t: 'إضافة منطقة توصيل',
            z_name: 'الاسم *', z_fee: 'السعر ($) *', z_free: 'مجاني فوق ($، اختياري)',
            z_eta: 'المدة (دقيقة)', add_zone_btn: 'إضافة',
            st_pending: 'قيد الانتظار', st_confirmed: 'مؤكدة', st_preparing: 'قيد التحضير',
            st_ready: 'جاهزة', st_on_way: 'في الطريق', st_delivered: 'تم التوصيل',
            free_over: 'مجاني فوق', min_unit: 'د',
            z_no_free: 'لا يوجد توصيل مجاني', z_fee_label: 'الرسوم',
            active_on: 'مفعّلة', active_off: 'معطّلة',
            enable_btn: 'تفعيل', disable_btn: 'تعطيل',
            approve_btn: 'قبول', hide_btn: 'إخفاء',
            assigned_label: 'المكلَّف', unassigned: 'غير مكلَّف'
        }
    },

    getLang() {
        const l = localStorage.getItem(this.LANG_KEY) || 'en';
        return this.dict[l] ? l : 'en';
    },

    t(key) {
        const lang = this.getLang();
        return (this.dict[lang] && this.dict[lang][key]) || this.dict.en[key] || key;
    },

    // Localized option name/group with fallback to base (English).
    // Accepts API rows ({name,name_fr,name_ar}) or cart snapshots
    // ({name_en,...} or legacy plain strings).
    pickOptName(o) {
        if (typeof o === 'string') return o;
        if (!o) return '';
        const lang = this.getLang();
        if (lang === 'fr') return o.name_fr || o.name || '';
        if (lang === 'ar') return o.name_ar || o.name || '';
        return o.name_en || o.name || '';
    },

    pickOptGroup(o) {
        if (typeof o === 'string') return '';
        if (!o) return '';
        const lang = this.getLang();
        if (lang === 'fr') return o.group_fr || o.group_name || o.group || '';
        if (lang === 'ar') return o.group_ar || o.group_name || o.group || '';
        return o.group_en || o.group_name || o.group || '';
    },

    setLang(lang) {
        if (!this.dict[lang]) return;
        localStorage.setItem(this.LANG_KEY, lang);
        location.reload();
    },

    apply() {
        const lang = this.getLang();
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.querySelectorAll('[data-i18n]').forEach(el => {
            el.textContent = this.t(el.dataset.i18n);
        });
        document.querySelectorAll('[data-i18n-ph]').forEach(el => {
            el.placeholder = this.t(el.dataset.i18nPh);
        });
        const cur = document.getElementById('langCurrent');
        if (cur) cur.textContent = lang.toUpperCase();
        document.querySelectorAll('.lang-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });
    },

    closeMenu() {
        document.getElementById('langMenu')?.classList.add('hidden');
    },

    init() {
        this.apply();
        const globe = document.getElementById('langGlobeBtn');
        const menu = document.getElementById('langMenu');
        if (globe && menu && !globe.dataset.wired) {
            globe.dataset.wired = '1';
            globe.addEventListener('click', (e) => {
                e.stopPropagation();
                menu.classList.toggle('hidden');
            });
            document.addEventListener('click', (e) => {
                if (!document.getElementById('langDropdown')?.contains(e.target)) this.closeMenu();
            });
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') this.closeMenu();
            });
        }
        document.querySelectorAll('.lang-option').forEach(btn => {
            if (btn.dataset.wired) return;
            btn.dataset.wired = '1';
            btn.addEventListener('click', () => this.setLang(btn.dataset.lang));
        });
    }
};
