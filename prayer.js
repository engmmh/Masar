"use strict";
  /* ---------------- azkar (morning / evening remembrance) ---------------- */
  // المصدر: كتاب "حصن المسلم من أذكار الكتاب والسنة" للشيخ سعيد بن علي بن وهف
  // القحطاني — بيانات نصية موثّقة (rn0x/Alsarmad — Adhkar-json)، وليست مكتوبة يدويًا.
  var AZKAR_SOURCE = 'حصن المسلم من أذكار الكتاب والسنة — سعيد بن علي بن وهف القحطاني';
  var AZKAR = {
    morning: [
      { t: "أَعُوذُ بِاللَّهِ مِنَ الشَّيطَانِ الرَّجِيمِ ﴿اللَّهُ لاَ إِلَهَ إِلاَّ هُوَ الْحَيُّ الْقَيُّومُ لاَ تَأْخُذُهُ سِنَةٌ وَلاَ نَوْمٌ لَّهُ مَا فِي السَّمَوَاتِ وَمَا فِي الأَرْضِ مَن ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلاَّ بِإِذْنِهِ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ وَلاَ يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلاَّ بِمَا شَاء وَسِعَ كُرْسِيُّهُ السَّمَوَاتِ وَالْأَرْضَ وَلاَ يَؤُودُهُ حِفْظُهُمَا وَهُوَ الْعَلِيُّ الْعَظِيمُ﴾.", n: 1, note: "آية الكرسي" },
      { t: "بسم الله الرحمن الرحيم ﴿قُلْ هُوَ اللَّهُ أَحَدٌ* اللَّهُ الصَّمَدُ* لَمْ يَلِدْ وَلَمْ يُولَدْ* وَلَمْ يَكُن لَّهُ كُفُواً أَحَدٌ﴾.  بسم الله الرحمن الرحيم ﴿قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ* مِن شَرِّ مَا خَلَقَ* وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ* وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ* وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ﴾.  بسم الله الرحمن الرحيم ﴿قُلْ أَعُوذُ بِرَبِّ النَّاسِ* مَلِكِ النَّاسِ* إِلَهِ النَّاسِ* مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ* الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ* مِنَ الْجِنَّةِ وَ النَّاسِ﴾", n: 3, note: "سورة الإخلاص والمعوذتان" },
      { t: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ ، وَالْحَمْدُ لِلَّهِ، لاَ إِلَهَ إلاَّ اللَّهُ وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذَا الْيَوْمِ وَخَيرَ مَا بَعْدَهُ ، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي  هَذَا الْيَوْمِ وَشَرِّ مَا بَعْدَهُ، رَبِّ أَعُوذُ بِكَ مِنَ الْكَسَلِ وَسُوءِ الْكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ", n: 1 },
      { t: "اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا ، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ", n: 1 },
      { t: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلاَّ أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لاَ يَغْفِرُ الذُّنوبَ إِلاَّ أَنْتَ", n: 1, note: "سيد الاستغفار" },
      { t: "اللَّهُمَّ إِنِّي أَصْبَحْتُ أُشْهِدُكَ، وَأُشْهِدُ حَمَلَةَ عَرْشِكَ، وَمَلاَئِكَتِكَ، وَجَمِيعَ خَلْقِكَ، أَنَّكَ أَنْتَ اللَّهُ لَا إِلَهَ إِلاَّ أَنْتَ وَحْدَكَ لاَ شَرِيكَ لَكَ، وَأَنَّ مُحَمَّداً عَبْدُكَ وَرَسُولُكَ", n: 4 },
      { t: "اللَّهُمَّ مَا أَصْبَحَ بِي مِنْ نِعْمَةٍ أَوْ بِأَحَدٍ مِنْ خَلْقِكَ فَمِنْكَ وَحْدَكَ لاَ شَرِيكَ لَكَ، فَلَكَ الْحَمْدُ وَلَكَ الشُّكْرُ", n: 1 },
      { t: "اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي، لاَ إِلَهَ إِلاَّ أَنْتَ. اللَّهُمَّ  إِنِّي أَعُوذُ بِكَ مِنَ الْكُفْرِ، وَالفَقْرِ، وَأَعُوذُ بِكَ مِنْ عَذَابِ القَبْرِ، لاَ إِلَهَ إِلاَّ أَنْتَ", n: 3 },
      { t: "حَسْبِيَ اللَّهُ لاَ إِلَهَ إِلاَّ هُوَ عَلَيهِ تَوَكَّلتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ", n: 1 },
      { t: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالآخِرَةِ، اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ: فِي دِينِي وَدُنْيَايَ وَأَهْلِي، وَمَالِي، اللَّهُمَّ اسْتُرْ عَوْرَاتِي، وَآمِنْ رَوْعَاتِي، اللَّهُمَّ احْفَظْنِي مِنْ بَينِ يَدَيَّ، وَمِنْ خَلْفِي، وَعَنْ يَمِينِي، وَعَنْ شِمَالِي، وَمِنْ فَوْقِي، وَأَعُوذُ بِعَظَمَتِكَ أَنْ أُغْتَالَ مِنْ تَحْتِي", n: 1 },
      { t: "اللَّهُمَّ عَالِمَ الغَيْبِ وَالشَّهَادَةِ فَاطِرَ السَّمَوَاتِ وَالْأَرْضِ، رَبَّ كُلِّ شَيْءٍ وَمَلِيكَهُ، أَشْهَدُ أَنْ لاَ إِلَهَ إِلاَّ أَنْتَ، أَعُوذُ بِكَ مِنْ شَرِّ نَفْسِي، وَمِنْ شَرِّ الشَّيْطانِ وَشَرَكِهِ، وَأَنْ أَقْتَرِفَ عَلَى  نَفْسِي سُوءاً، أَوْ أَجُرَّهُ إِلَى مُسْلِمٍ", n: 1 },
      { t: "بِسْمِ اللَّهِ الَّذِي لاَ يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلاَ فِي السّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ", n: 3 },
      { t: "رَضِيتُ بِاللَّهِ رَبَّاً، وَبِالْإِسْلاَمِ دِيناً، وَبِمُحَمَّدٍ صلى الله عليه وسلم نَبِيّاً", n: 3 },
      { t: "يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغيثُ أَصْلِحْ لِي شَأْنِيَ كُلَّهُ وَلاَ تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ", n: 1 },
      { t: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ رَبِّ الْعَالَمِينَ، اللَّهُـمَّ إِنِّي أَسْأَلُكَ خَيْرَ هَذَا الْيَوْمِ:فَتْحَهُ، وَنَصْرَهُ، وَنورَهُ، وَبَرَكَتَهُ، وَهُدَاهُ، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِيهِ وَشَرِّ مَا بَعْدَهُ", n: 1 },
      { t: "أَصْبَحْنا عَلَى فِطْرَةِ الْإِسْلاَمِ، وَعَلَى كَلِمَةِ الْإِخْلاَصِ، وَعَلَى دِينِ نَبِيِّنَا مُحَمَّدٍ صلى الله عليه وسلم، وَعَلَى مِلَّةِ أَبِينَا إِبْرَاهِيمَ، حَنِيفاً مُسْلِماً وَمَا كَانَ مِنَ الْمُشرِكِينَ", n: 1 },
      { t: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ", n: 100 },
      { t: "لاَ إِلَهَ إِلاَّ اللَّهُ وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ", n: 10 },
      { t: "لاَ إِلَهَ إِلاَّ اللَّهُ، وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ", n: 100 },
      { t: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ: عَدَدَ خَلْقِهِ، وَرِضَا نَفْسِهِ، وَزِنَةَ عَرْشِهِ، وَمِدَادَ كَلِمَاتِهِ", n: 3 },
      { t: "اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْماً نَافِعاً، وَرِزْقاً طَيِّباً، وَعَمَلاً مُتَقَبَّلاً", n: 1 },
      { t: "أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ", n: 100 },
      { t: "اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبَيِّنَا مُحَمَّدٍ", n: 10 }
    ],
    evening: [
      { t: "أَعُوذُ بِاللَّهِ مِنَ الشَّيطَانِ الرَّجِيمِ ﴿اللَّهُ لاَ إِلَهَ إِلاَّ هُوَ الْحَيُّ الْقَيُّومُ لاَ تَأْخُذُهُ سِنَةٌ وَلاَ نَوْمٌ لَّهُ مَا فِي السَّمَوَاتِ وَمَا فِي الأَرْضِ مَن ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلاَّ بِإِذْنِهِ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ وَلاَ يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلاَّ بِمَا شَاء وَسِعَ كُرْسِيُّهُ السَّمَوَاتِ وَالْأَرْضَ وَلاَ يَؤُودُهُ حِفْظُهُمَا وَهُوَ الْعَلِيُّ الْعَظِيمُ﴾.", n: 1, note: "آية الكرسي" },
      { t: "بسم الله الرحمن الرحيم ﴿قُلْ هُوَ اللَّهُ أَحَدٌ* اللَّهُ الصَّمَدُ* لَمْ يَلِدْ وَلَمْ يُولَدْ* وَلَمْ يَكُن لَّهُ كُفُواً أَحَدٌ﴾.  بسم الله الرحمن الرحيم ﴿قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ* مِن شَرِّ مَا خَلَقَ* وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ* وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ* وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ﴾.  بسم الله الرحمن الرحيم ﴿قُلْ أَعُوذُ بِرَبِّ النَّاسِ* مَلِكِ النَّاسِ* إِلَهِ النَّاسِ* مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ* الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ* مِنَ الْجِنَّةِ وَ النَّاسِ﴾", n: 3, note: "سورة الإخلاص والمعوذتان" },
      { t: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لاَ إِلَهَ إلاَّ اللَّهُ وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذِهِ اللَّيْلَةِ وَخَيْرَ مَا بَعْدَهَا، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَذِهِ اللَّيْلَةِ وَشَرِّ مَا بَعْدَهَا، رَبِّ أَعُوذُ بِكَ مِنَ الْكَسَلِ وَسُوءِ الْكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ", n: 1 },
      { t: "اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ وَإِلَيْكَ الْمَصِيرُ", n: 1 },
      { t: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلاَّ أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لاَ يَغْفِرُ الذُّنوبَ إِلاَّ أَنْتَ", n: 1, note: "سيد الاستغفار" },
      { t: "اللَّهُمَّ إِنِّي أَمْسَيْتُ أُشْهِدُكَ، وَأُشْهِدُ حَمَلَةَ عَرْشِكَ، وَمَلاَئِكَتِكَ، وَجَمِيعَ خَلْقِكَ، أَنَّكَ أَنْتَ اللَّهُ لَا إِلَهَ إِلاَّ أَنْتَ وَحْدَكَ لاَ شَرِيكَ لَكَ، وَأَنَّ مُحَمَّداً عَبْدُكَ وَرَسُولُكَ", n: 4 },
      { t: "اللَّهُمَّ مَا أَمْسَى بِي مِنْ نِعْمَةٍ أَوْ بِأَحَدٍ مِنْ خَلْقِكَ فَمِنْكَ وَحْدَكَ لاَ شَرِيكَ لَكَ، فَلَكَ الْحَمْدُ وَلَكَ الشُّكْرُ", n: 1 },
      { t: "اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي، لاَ إِلَهَ إِلاَّ أَنْتَ. اللَّهُمَّ  إِنِّي أَعُوذُ بِكَ مِنَ الْكُفْرِ، وَالفَقْرِ، وَأَعُوذُ بِكَ مِنْ عَذَابِ القَبْرِ، لاَ إِلَهَ إِلاَّ أَنْتَ", n: 3 },
      { t: "حَسْبِيَ اللَّهُ لاَ إِلَهَ إِلاَّ هُوَ عَلَيهِ تَوَكَّلتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ", n: 1 },
      { t: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالآخِرَةِ، اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ: فِي دِينِي وَدُنْيَايَ وَأَهْلِي، وَمَالِي، اللَّهُمَّ اسْتُرْ عَوْرَاتِي، وَآمِنْ رَوْعَاتِي، اللَّهُمَّ احْفَظْنِي مِنْ بَينِ يَدَيَّ، وَمِنْ خَلْفِي، وَعَنْ يَمِينِي، وَعَنْ شِمَالِي، وَمِنْ فَوْقِي، وَأَعُوذُ بِعَظَمَتِكَ أَنْ أُغْتَالَ مِنْ تَحْتِي", n: 1 },
      { t: "اللَّهُمَّ عَالِمَ الغَيْبِ وَالشَّهَادَةِ فَاطِرَ السَّمَوَاتِ وَالْأَرْضِ، رَبَّ كُلِّ شَيْءٍ وَمَلِيكَهُ، أَشْهَدُ أَنْ لاَ إِلَهَ إِلاَّ أَنْتَ، أَعُوذُ بِكَ مِنْ شَرِّ نَفْسِي، وَمِنْ شَرِّ الشَّيْطانِ وَشَرَكِهِ، وَأَنْ أَقْتَرِفَ عَلَى  نَفْسِي سُوءاً، أَوْ أَجُرَّهُ إِلَى مُسْلِمٍ", n: 1 },
      { t: "بِسْمِ اللَّهِ الَّذِي لاَ يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلاَ فِي السّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ", n: 3 },
      { t: "رَضِيتُ بِاللَّهِ رَبَّاً، وَبِالْإِسْلاَمِ دِيناً، وَبِمُحَمَّدٍ صلى الله عليه وسلم نَبِيّاً", n: 3 },
      { t: "يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغيثُ أَصْلِحْ لِي شَأْنِيَ كُلَّهُ وَلاَ تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ", n: 1 },
      { t: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ رَبِّ الْعَالَمِينَ، اللَّهُـمَّ إِنِّي أَسْأَلُكَ خَيْرَ هَذِهِ اللَّيْلَةِ: فَتْحَهَا، وَنَصْرَهَا، وَنورَهَا، وَبَرَكَتَهَا، وَهُدَاهَا، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِيهَا وَشَرِّ مَا بَعْدَهَا", n: 1 },
      { t: "أَمْسَيْنَا عَلَى فِطْرَةِ الْإِسْلاَمِ، وَعَلَى كَلِمَةِ الْإِخْلاَصِ، وَعَلَى دِينِ نَبِيِّنَا مُحَمَّدٍ صلى الله عليه وسلم، وَعَلَى مِلَّةِ أَبِينَا إِبْرَاهِيمَ، حَنِيفاً مُسْلِماً وَمَا كَانَ مِنَ الْمُشرِكِينَ", n: 1 },
      { t: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ", n: 100 },
      { t: "لاَ إِلَهَ إِلاَّ اللَّهُ وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ", n: 10 },
      { t: "أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ", n: 100 },
      { t: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ", n: 3 },
      { t: "اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبَيِّنَا مُحَمَّدٍ", n: 10 }
    ]
  };


  /* ---------------- prayer times (Umm al-Qura, Riyadh) ---------------- */
  var rad = Math.PI / 180, deg = 180 / Math.PI;
  function sin(d) { return Math.sin(d * rad); } function cos(d) { return Math.cos(d * rad); } function tan(d) { return Math.tan(d * rad); }
  function asin(x) { return deg * Math.asin(x); } function acos(x) { return deg * Math.acos(x); }
  function atan2(y, x) { return deg * Math.atan2(y, x); } function arccot(x) { return deg * Math.atan(1 / x); }
  function fixA(a) { return a - 360 * Math.floor(a / 360); } function fixH(a) { return a - 24 * Math.floor(a / 24); }
  function julian(y, m, d) { if (m <= 2) { y -= 1; m += 12; } var A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4); return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5; }
  function sunPos(jd) {
    var D = jd - 2451545.0, g = fixA(357.529 + 0.98560028 * D), q = fixA(280.459 + 0.98564736 * D);
    var L = fixA(q + 1.915 * sin(g) + 0.020 * sin(2 * g)), e = 23.439 - 0.00000036 * D;
    var RA = fixH(atan2(cos(e) * sin(L), cos(L)) / 15);
    return { decl: asin(sin(e) * sin(L)), eq: q / 15 - RA };
  }
  function midDay(jd, t) { return fixH(12 - sunPos(jd + t).eq); }
  function angleTime(jd, ang, t, ccw) {
    var decl = sunPos(jd + t).decl, noon = midDay(jd, t);
    var x = (-sin(ang) - sin(decl) * sin(LAT)) / (cos(decl) * cos(LAT));
    return noon + (ccw ? -1 : 1) * acos(x) / 15;
  }
  function asrTime(jd, f, t) {
    var decl = sunPos(jd + t).decl;
    return angleTime(jd, -arccot(f + tan(Math.abs(LAT - decl))), t, false);
  }
  function isRamadan(y, m, d) {
    try { return new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", { month: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d, 12))) === "9"; }
    catch (e) { return false; }
  }
  var schedCache = {};
  function sched(key) {
    if (schedCache[key]) return schedCache[key];
    var p = key.split("-").map(Number), jd = julian(p[0], p[1], p[2]) - LNG / (15 * 24);
    var t = { fajr: 5 / 24, sunrise: 6 / 24, dhuhr: 12 / 24, asr: 13 / 24, sunset: 18 / 24 }, r, k;
    for (var i = 0; i < 2; i++) {
      r = { fajr: angleTime(jd, 18.5, t.fajr, true), sunrise: angleTime(jd, 0.833, t.sunrise, true), dhuhr: midDay(jd, t.dhuhr), asr: asrTime(jd, 1, t.asr), sunset: angleTime(jd, 0.833, t.sunset, false) };
      t = {}; for (k in r) t[k] = r[k] / 24;
    }
    var adj = TZ - LNG / 15; for (k in r) r[k] += adj;
    var isha = r.sunset + (isRamadan(p[0], p[1], p[2]) ? 120 : 90) / 60;
    var out = { times: [r.fajr, r.dhuhr, r.asr, r.sunset, isha], sunrise: r.sunrise };
    schedCache[key] = out; return out;
  }
  function windowOf(key, i) {
    var s = sched(key), start = s.times[i], end;
    if (i === 0) end = s.sunrise; else if (i === 1) end = s.times[2]; else if (i === 2) end = s.times[3];
    else if (i === 3) end = s.times[4]; else end = 24 + sched(addDays(key, 1)).times[0];
    return { start: start, end: end };
  }
  function pname(key, i) { return (i === 1 && dowOf(key) === 5) ? "الجمعة" : PRAYERS[i].n; }
  function hijri(key) {
    try {
      var p = key.split("-").map(Number);
      return new Intl.DateTimeFormat("ar-u-nu-latn-ca-islamic-umalqura", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(p[0], p[1] - 1, p[2], 12)));
    } catch (e) { return ""; }
  }
  function greg(key) {
    var p = key.split("-").map(Number);
    return WD[dowOf(key)] + " " + p[2] + "/" + p[1] + "/" + p[0];
  }


  /* ---------------- prayer logic ---------------- */
  function rec(key, i) { var d = state.days[key]; return d && d[PRAYERS[i].k]; }
  function status(key, i, now) {
    var r = rec(key, i);
    if (r && r.t) return r.late ? "late" : (r.qada ? "qada" : "done");
    if (key < state.settings.startDate) return "na";
    if (key > now.key) return "future";
    if (key < now.key) return "missed";
    var w = windowOf(key, i);
    if (now.h < w.start) return "upcoming";
    if (now.h < w.end) return "current";
    return "missed";
  }
  function isDone(st) { return st === "done" || st === "late" || st === "qada"; }
  // Real epoch ms of a prayer window's end, for comparing against a recorded qada
  // timestamp (r.t, itself a real Date.now() epoch ms, not the TZ-shifted "virtual hour"
  // windowOf() returns). shiftedMidnight is "key"'s midnight in the same +TZ-shifted frame
  // nowR() uses, so subtracting TZ*3600e3 converts back to a true, comparable epoch.
  function windowEndMs(key, i) {
    var p = key.split("-").map(Number);
    var shiftedMidnight = Date.UTC(p[0], p[1] - 1, p[2]);
    return shiftedMidnight + windowOf(key, i).end * 3600000 - TZ * 3600000;
  }
  // "كامل" (complete) day: every prayer recorded, and any qada recorded within 48h of
  // that prayer's window ending — a qada logged a week later no longer keeps the streak.
  function dayComplete(key) {
    var d = state.days[key]; if (!d) return false;
    return PRAYERS.every(function (p, i) {
      var r = d[p.k]; if (!r || !r.t) return false;
      if (!r.qada) return true;
      return (r.t - windowEndMs(key, i)) <= 48 * 3600000;
    });
  }
  // "في الوقت" (on time) day: all 5 prayers registered inside their own window — stricter
  // than dayComplete(), which also accepts same-day-late or 48h-qada recordings.
  function dayOnTime(key) {
    var d = state.days[key]; if (!d) return false;
    return PRAYERS.every(function (p) { var r = d[p.k]; return !!(r && r.t && !r.late && !r.qada); });
  }
  function streakBy(now, test) {
    var k = now.key, n = 0;
    if (!test(k)) k = addDays(k, -1);
    while (test(k) && n < 5000) { n++; k = addDays(k, -1); }
    return n;
  }
  function bestStreakBy(test) {
    var keys = Object.keys(state.days).sort(), best = 0, cur = 0, prev = null;
    keys.forEach(function (k) {
      if (test(k)) { cur = (prev && addDays(prev, 1) === k) ? cur + 1 : 1; prev = k; if (cur > best) best = cur; }
      else { cur = 0; prev = null; }
    });
    return best;
  }
  function streak(now) { return streakBy(now, dayComplete); }
  function bestStreak() { return bestStreakBy(dayComplete); }
  function streakOnTime(now) { return streakBy(now, dayOnTime); }
  function bestStreakOnTime() { return bestStreakBy(dayOnTime); }
  function fmtDaysAr(n) {
    if (n === 1) return "يوم";
    if (n === 2) return "يومين";
    if (n >= 3 && n <= 10) return n + " أيام";
    return n + " يوم";
  }
  var STREAK_MILESTONES = [
    { d: 3, label: "3 أيام" }, { d: 7, label: "أسبوع كامل" }, { d: 14, label: "أسبوعين" },
    { d: 30, label: "شهر كامل" }, { d: 50, label: "50 يوم" }, { d: 100, label: "100 يوم" },
    { d: 200, label: "200 يوم" }, { d: 365, label: "سنة كاملة" }
  ];
  // Two parallel streaks shown side by side: "كامل" (complete — every prayer eventually
  // recorded, qada within 48h) drives the main message/milestones since it's the more
  // forgiving, encouraging number; "في الوقت" (on-time only) sits beside it as the
  // stricter companion stat, with its own best-ever record shown only if higher.
  function streakBannerHTML(now) {
    var st = streak(now), best = bestStreak();
    var stOT = streakOnTime(now), bestOT = bestStreakOnTime();
    if (!st && !stOT) {
      return '<div class="card streakbanner off"><div class="sb-ico">' + ico("flame") + '</div><div class="sb-body"><h3>ابدأ سلسلتك اليوم</h3><p class="muted" style="font-size:14px">خلّص الصلوات الخمس النهاردة عشان تبدأ سلسلة جديدة' + (best ? " · أفضل سلسلة سابقة " + best + " يوم" : "") + "</p></div></div>";
    }
    var hit = STREAK_MILESTONES.filter(function (m) { return m.d === st; })[0];
    var next = STREAK_MILESTONES.filter(function (m) { return m.d > st; })[0];
    var sub = !st ? "بدأت النهاردة" : hit ? "🎉 وصلت لـ" + hit.label + "! استمر كده"
      : (next ? "كمان " + fmtDaysAr(next.d - st) + " لـ" + next.label + " 🔥"
        : "رقم قياسي! استمر على البركة");
    return '<div class="card streakbanner on dual"><div class="sb-col sb-main"><div class="sb-ico">' + ico("flame") + '</div><div class="sb-body"><div class="sb-num"><b class="num">' + st + '</b><span>' + (st === 1 ? "يوم كامل" : "أيام كاملة") + '</span></div><p class="sb-sub">' + esc(sub) + "</p></div></div>" +
      '<div class="sb-div"></div>' +
      '<div class="sb-col sb-ot"><div class="sb-num"><b class="num">' + stOT + '</b><span>' + (stOT === 1 ? "يوم في الوقت" : "أيام في الوقت") + '</span></div>' +
      (bestOT > stOT ? '<p class="sb-sub muted">أفضل ' + bestOT + '</p>' : "") + "</div>" +
      (best > st ? '<div class="sb-best">أفضل<b class="num">' + best + "</b></div>" : "") + "</div>";
  }
  function togglePrayer(key, i) {
    var now = nowR(), st = status(key, i, now), d = state.days[key] || (state.days[key] = {}), k = PRAYERS[i].k;
    if (isDone(st)) { delete d[k]; saveDay(key); toast("تم التراجع عن تسجيل " + pname(key, i)); render(); return; }
    if (st === "upcoming" || st === "future" || st === "na") return;
    var late = (key === now.key && st === "missed");
    d[k] = { t: now.ms };
    if (key < now.key) d[k].qada = 1; else if (late) d[k].late = 1;
    saveDay(key); render();
    toast(key < now.key ? "سُجّل قضاء " + pname(key, i) : (late ? "سُجّلت " + pname(key, i) + " بعد وقتها" : "تقبّل الله طاعتك"));
  }
  function missedList(now) {
    var out = [], k = state.settings.startDate, guard = 0;
    while (k <= now.key && guard++ < 800) {
      for (var i = 0; i < 5; i++) if (status(k, i, now) === "missed") out.push({ key: k, i: i });
      k = addDays(k, 1);
    }
    return out;
  }


  /* ---------------- quran logic ---------------- */
  // Verified Quran text + structure (Hafs): quran/quran.json. See QURAN.source
  // for the exact citation shown in the Mushaf view — never type Quran text by hand.
  var QURAN = null, quranLoadPromise = null;
  function loadQuran() {
    return fetch("quran/quran.json").then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status + " loading quran.json");
      return r.json();
    }).then(function (d) { QURAN = d; }).catch(function (err) {
      console.error("Masar: failed to load Quran data", err);
    });
  }
  // Lazy, once-only trigger: the 1.4MB quran.json used to load on every boot
  // (even before the PIN screen, even for accounts without Quran access) — now
  // it's fetched only the first time the person actually opens the Mushaf or
  // the تسميع (hide-text) view, and re-renders the current Quran sub-view once it lands.
  function ensureQuranLoaded() {
    if (QURAN || quranLoadPromise) return quranLoadPromise;
    quranLoadPromise = loadQuran().then(function () {
      if (state.tab === "quran" && state.qv && (state.qv.mode === "mushaf" || state.qv.mode === "hide" || state.qv.mode === "lawh")) render();
    });
    return quranLoadPromise;
  }
  function arNum(n) { return String(n).replace(/[0-9]/g, function (d) { return "٠١٢٣٤٥٦٧٨٩"[d]; }); }
  // Display-only: strips the optional Hafs waqf/pause-sign annotations (U+06D6–U+06ED —
  // recitation-guidance marks, not letters or vowels) before rendering. Tested across
  // several fonts: these specific marks break cursive joining (render as disconnected
  // letters or missing-glyph boxes) depending on which Google Fonts subset chunk has
  // loaded, which is not reliably predictable. Dropping them changes no letter, vowel
  // or meaning — only an optional stop-sign hint — and the stored quran/quran.json
  // (the actual verified source) is never touched; only what's drawn on screen is.
  function quranDisplayText(s) { return String(s).replace(/[ۖ-ۭ]/g, ""); }
  function target() { var u = UNITS[state.settings.unit] || UNITS.page; return Math.max(1, Math.round(state.settings.amount * u.f)); }
  function pagesOn(key) { var d = state.days[key]; return d && d.q ? d.q : 0; }
  function totalPages() { var t = 0; for (var k in state.days) t += (state.days[k].q || 0); return t; }
  function juzOf(p) { return Math.min(30, p <= 21 ? 1 : Math.floor((p - 2) / 20) + 1); }

  /* ---------------- لوح الحفظ (lawh) — SRS memorization board ---------------- */
  // Reuses the exact spaced-repetition interval table and stage semantics already
  // proven for vocabulary review (SRS_STAGE_DAYS / SRS_MAX_STAGE / cardStage in
  // learn.js), applied to Quran pages instead of vocab cards. Persisted under
  // state.learn.lawh so it rides the existing "learn" meta sync bucket — no change
  // to the storage/sync plumbing in app.js was needed.
  // Phase: اللوح moved from page-keyed cells to surah/ayah-range units (L.units,
  // keyed by unitId() — see above). L.pages is the old page-keyed shape; it's kept
  // read-only and migrated into L.units the first time QURAN data is available
  // (can't map a page to a surah before then), so nobody's existing progress is
  // lost by this change. Migration takes each marked page's status and applies it
  // to that page's starting surah as a whole-surah unit, keeping the best (highest)
  // status if more than one of that surah's old pages disagreed.
  function lawhData() {
    if (!state.learn.lawh) state.learn.lawh = { pages: {}, log: {} };
    var L = state.learn.lawh;
    if (!L.units) L.units = {};
    if (!L.migratedUnits && QURAN) {
      var pageKeys = L.pages ? Object.keys(L.pages) : [];
      pageKeys.forEach(function (pStr) {
        var c = L.pages[pStr]; if (!c || !c.status) return;
        var ayahs = pageAyahs(Number(pStr)); if (!ayahs.length) return;
        var id = unitId(ayahs[0].surah), existing = L.units[id];
        if (!existing || c.status > existing.status) {
          L.units[id] = { status: c.status, stage: c.stage, due: c.due, learnedAt: c.learnedAt };
        }
      });
      L.migratedUnits = 1;
      if (pageKeys.length) saveMeta("learn", 0);
    }
    return L;
  }
  function lawhCycle(id) {
    var L = lawhData(), key = nowR().key, cur = L.units[id] || { status: 0 };
    if (cur.status === 0) { cur.status = 1; }
    else if (cur.status === 1) {
      cur.status = 2; cur.stage = 1; cur.due = addDays(key, SRS_STAGE_DAYS[1]); cur.learnedAt = key;
      if (!L.log[key]) L.log[key] = { memorized: [], reviewed: [] };
      L.log[key].memorized.push(id);
    } else { cur = { status: 0 }; }
    L.units[id] = cur; saveMeta("learn", 500); render();
  }
  function lawhReview(id, good) {
    var L = lawhData(), key = nowR().key, cur = L.units[id]; if (!cur || cur.status !== 2) return;
    cur.stage = cardStage(cur);
    if (good) { cur.stage = Math.min(SRS_MAX_STAGE, cur.stage + 1); cur.due = addDays(key, SRS_STAGE_DAYS[cur.stage]); }
    else { cur.stage = 0; cur.due = addDays(key, 1); }
    if (!L.log[key]) L.log[key] = { memorized: [], reviewed: [] };
    L.log[key].reviewed.push(id);
    saveMeta("learn", 500); render();
  }
  // Only for a "large" surah (see isLargeSurah): a checkpoint covering part of
  // it, tracked and reviewed exactly like a whole-surah unit from here on.
  function lawhAddRange(s, from, to) {
    var surah = QURAN && QURAN.surahs[s - 1]; if (!surah) return;
    from = Math.max(1, Math.min(surah.ayahCount, Math.round(Number(from)) || 1));
    to = Math.max(from, Math.min(surah.ayahCount, Math.round(Number(to)) || from));
    var L = lawhData(), id = unitId(s, from, to);
    if (!L.units[id]) L.units[id] = { status: 0 };
    saveMeta("learn", 0); render();
  }
  function lawhRemoveRange(id) {
    var L = lawhData(); delete L.units[id]; saveMeta("learn", 0); render();
  }
  // Most recent تسميع result logged for this unit (any day), for the "آخر مرة"
  // trend line — lets a repeat session show whether fewer ayahs needed revealing
  // than last time, instead of the one-off finish toast being the only feedback.
  function lastSelfCheckFor(id) {
    var L = lawhData(), keys = Object.keys(L.log || {}).sort().reverse();
    for (var i = 0; i < keys.length; i++) {
      var checks = L.log[keys[i]].selfChecks || [];
      for (var j = checks.length - 1; j >= 0; j--) { if (checks[j].unit === id) return checks[j]; }
    }
    return null;
  }
  function addPages(n) {
    var key = nowR().key, d = state.days[key] || (state.days[key] = {});
    d.q = Math.max(0, (d.q || 0) + n);
    saveDay(key, 500); render();
  }
  function setPages(n) { var key = nowR().key, d = state.days[key] || (state.days[key] = {}); d.q = Math.max(0, n); saveDay(key, 500); render(); }


  function prayerView(now) {
    if (state.az) return azkarListHTML(state.az);
    var pv = state.pv;
    // The streak banner and the prayer-times ring used to also sit on the home screen —
    // they now live only here, as this section's own header, since the home "خطة اليوم"
    // card already summarizes today's prayer count in one line.
    var top = pv === "today" ? streakBannerHTML(now) + heroHTML(now) : "";
    return top + '<div class="seg2 two" style="margin-block:6px 12px"><button data-act="pv" data-v="today" aria-pressed="' + (pv === "today") + '">اليوم</button><button data-act="pv" data-v="archive" aria-pressed="' + (pv === "archive") + '">الأرشيف والفائت</button></div>' +
      (pv === "archive" ? archiveView(now) : alertHTML(now) + azkarEntryCardHTML() + prayersHTML(now));
  }
  function azkarEntryCardHTML() {
    return '<div class="card"><h3>الأذكار</h3><p class="muted" style="font-size:14px;margin-block:4px 10px">أذكار الصباح والمساء من حصن المسلم</p><div class="row wrapr">' +
      '<button class="btn" data-act="azkar-open" data-k="morning">🌅 أذكار الصباح</button>' +
      '<button class="btn alt" data-act="azkar-open" data-k="evening">🌙 أذكار المساء</button></div></div>';
  }
  // Only one not-yet-finished dhikr is shown "open" (full text + note) at a time; the
  // rest sit collapsed to a single line. Finishing the open one auto-advances the focus
  // to the next not-done item — reading one thing at a time instead of scanning a long
  // flat list for where you left off.
  function azkarListHTML(key) {
    var list = AZKAR[key];
    var prog = state.azProgress[key];
    if (!prog || prog.length !== list.length) prog = state.azProgress[key] = list.map(function (it) { return it.n; });
    if (!state.azOpen) state.azOpen = {};
    var openIdx = state.azOpen[key];
    if (openIdx == null || prog[openIdx] == null || prog[openIdx] <= 0) {
      openIdx = prog.findIndex(function (c) { return c > 0; });
      state.azOpen[key] = openIdx;
    }
    var doneCount = prog.filter(function (c) { return c <= 0; }).length;
    var pct = list.length ? Math.round(doneCount / list.length * 100) : 0;
    var items = list.map(function (it, i) {
      var left = prog[i], done = left <= 0, open = i === openIdx;
      return '<button class="azcard' + (done ? " done" : (!open ? " collapsed" : "")) + '" data-act="azkar-tap" data-k="' + key + '" data-i="' + i + '"' + (done ? " disabled" : "") + '><p class="az-text">' + esc(it.t) + "</p>" +
        (it.note && (open || done) ? '<p class="az-note muted">' + esc(it.note) + "</p>" : "") +
        '<span class="az-count">' + (done ? "✓" : left) + "</span></button>";
    }).join("");
    return '<button class="linkbtn" data-act="azkar-close">← رجوع</button><div class="card"><div class="row between"><h2 style="margin:0">' + (key === "morning" ? "أذكار الصباح" : "أذكار المساء") + '</h2><span class="chip">' + doneCount + " / " + list.length + '</span></div>' +
      '<div class="bar" style="margin-block-start:10px"><i style="width:' + pct + '%"></i></div>' +
      '<p class="muted" style="font-size:13px;margin-block-start:6px">اضغط على الذكر كل ما قلته مرة، للعدّاد يوصل صفر</p></div>' + items +
      '<button class="btn alt" data-act="azkar-reset" data-k="' + key + '" style="width:100%;margin-block-start:4px">إعادة البدء</button>';
  }

  function archiveView(now) {
    var s7 = 0, p7 = 0, ontime = 0, total = 0, allp = 0, qada = 0, key;
    var start = state.settings.startDate;
    for (var d = 0; d < 30; d++) {
      key = addDays(now.key, -d);
      for (var i = 0; i < 5; i++) {
        var st = status(key, i, now);
        if (st === "na" || st === "future" || st === "upcoming" || st === "current") continue;
        allp++; if (isDone(st)) total++;
        if (st === "done") ontime++;
        if (d < 7) { p7++; if (isDone(st)) s7++; }
      }
    }
    for (var k in state.days) for (var j = 0; j < 5; j++) { var r = state.days[k][PRAYERS[j].k]; if (r && r.qada) qada++; }
    var pct7 = p7 ? Math.round(s7 / p7 * 100) : 0, pct30 = allp ? Math.round(total / allp * 100) : 0;
    var rows = "", tgt = target();
    for (var n = 0; n < state.archiveN; n++) {
      key = addDays(now.key, -n);
      if (key < start && n > 0) break;
      var cells = "";
      for (var q = 0; q < 5; q++) {
        var s = status(key, q, now), sym = isDone(s) ? "✓" : (s === "missed" ? "✕" : "·");
        cells += '<td><button class="dot ' + s + '" data-act="tp" data-d="' + key + '" data-p="' + q + '" aria-label="' + esc(pname(key, q)) + '"' + (s === "upcoming" || s === "future" || s === "na" ? " disabled" : "") + ">" + sym + "</button></td>";
      }
      var pq = pagesOn(key), qcls = pq >= tgt ? "done" : (pq > 0 ? "late" : (key < start || key > now.key ? "na" : "missed"));
      cells += '<td><span class="dot ' + qcls + '" style="cursor:default">' + (pq > 0 ? pq : (qcls === "missed" ? "✕" : "·")) + "</span></td>";
      var pp = key.split("-");
      rows += '<tr class="' + (key === now.key ? "today" : "") + '"><td class="day">' + WD_S[dowOf(key)] + " " + Number(pp[2]) + "/" + Number(pp[1]) + "</td>" + cells + "</tr>";
    }
    var canMore = addDays(now.key, -state.archiveN) >= start;
    return head(now) +
      '<div class="stats"><div class="stat"><b class="num">' + streak(now) + '</b><span>سلسلة الأيام الكاملة</span></div>' +
      '<div class="stat"><b class="num">' + bestStreak() + '</b><span>أفضل سلسلة</span></div>' +
      '<div class="stat"><b class="num">' + pct7 + '%</b><span>التزام آخر 7 أيام</span></div>' +
      '<div class="stat"><b class="num">' + pct30 + '%</b><span>التزام آخر 30 يومًا</span></div>' +
      '<div class="stat"><b class="num">' + (allp ? Math.round(ontime / allp * 100) : 0) + '%</b><span>في الوقت (30 يومًا)</span></div>' +
      '<div class="stat"><b class="num">' + qada + '</b><span>صلوات قضاء</span></div></div>' +
      '<div class="tw"><table><thead><tr><th style="text-align:start;padding-inline-start:10px">اليوم</th><th>فجر</th><th>ظهر</th><th>عصر</th><th>مغرب</th><th>عشاء</th><th>ورد</th></tr></thead><tbody>' + rows + "</tbody></table></div>" +
      '<div class="legend"><span><i style="background:var(--done)"></i>في وقتها</span><span><i style="background:var(--amber)"></i>قضاء أو بعد الوقت</span><span><i style="background:var(--miss)"></i>فاتت</span></div>' +
      '<p class="muted" style="font-size:14px">اضغط أي خانة فاتت لتسجيل قضائها. واضغط خانة مسجّلة للتراجع.</p>' +
      (canMore ? '<div class="row" style="margin-block:10px"><button class="btn alt" data-act="more">عرض أيام أقدم</button></div>' : "") +
      '<div class="card" style="margin-block-start:12px"><h3>بداية التتبع</h3><p class="muted" style="font-size:14px">الصلوات قبل هذا التاريخ لا تُحسب فائتة. غيّره لو عايز تراجع أيام أقدم.</p>' +
      '<label class="field">التاريخ<input type="date" id="startdate" value="' + esc(start) + '" max="' + now.key + '"></label></div>';
  }

  // Slices the verified surah/ayah text into the exact ayah range of one printed
  // Mushaf page, using QURAN.pageStart (the same structural boundaries used for
  // the khatma tracker) — never hand-typed, always derived from the source data.
  function pageAyahs(p) {
    if (!QURAN) return [];
    var start = QURAN.pageStart[p - 1], end = p < 604 ? QURAN.pageStart[p] : null, out = [];
    for (var s = start[0]; s <= (end ? end[0] : 114); s++) {
      var surah = QURAN.surahs[s - 1];
      var from = (s === start[0]) ? start[1] : 1;
      var to = (end && s === end[0]) ? end[1] - 1 : surah.ayahCount;
      for (var a = from; a <= to; a++) out.push({ surah: s, surahName: surah.name, ayah: a, text: surah.verses[a - 1].text });
      if (end && s === end[0]) break;
    }
    return out;
  }

  // Which printed Mushaf page (1-604) contains ayah 1 of surah s? Most surahs start
  // at the top of a fresh page (pageStart[p-1] === [s,1] exactly), but several short
  // surahs — mostly in juz 30 — start mid-page, sharing it with the previous surah's
  // tail, so a page's start surah alone can under/over-shoot. Walking pages in order
  // and tracking the last page whose start is still <= (s, ayah 1) in reading order
  // gets both cases right; results are memoized since the surah list calls this once
  // per surah on every render.
  var SURAH_PAGE_CACHE = {};
  function pageForSurah(s) {
    if (!QURAN) return 1;
    if (SURAH_PAGE_CACHE[s]) return SURAH_PAGE_CACHE[s];
    var candidate = 1;
    for (var p = 1; p <= 604; p++) {
      var st = QURAN.pageStart[p - 1], sp = st[0], ap = st[1];
      if (sp < s) { candidate = p; }
      else if (sp === s && ap === 1) { candidate = p; break; }
      else if (sp === s) { /* page starts mid-surah s (ap>1) — ayah1 was earlier */ }
      else { break; } // sp > s: gone past it
    }
    SURAH_PAGE_CACHE[s] = candidate;
    return candidate;
  }
  // Which printed Mushaf page contains a specific (surah, ayah)? Same walk as
  // pageForSurah but checks the ayah too, so it also works for an ayah partway
  // through a surah (used to jump the Mushaf open to the start of a saved range).
  function pageForAyah(s, a) {
    if (!QURAN) return 1;
    var candidate = 1;
    for (var p = 1; p <= 604; p++) {
      var st = QURAN.pageStart[p - 1], sp = st[0], ap = st[1];
      if (sp < s || (sp === s && ap <= a)) candidate = p; else break;
    }
    return candidate;
  }
  // A surah "spans more than one Mushaf page" — the natural, data-driven cutoff
  // for offering ayah-range splitting in اللوح: a surah that fits on one page is
  // a fine single memorization unit, one that doesn't benefits from checkpoints.
  // Math.max guards the handful of short surahs that *start* mid-page sharing it
  // with the next surah (pageForSurah(s+1) would otherwise read as "before s").
  function lastPageOfSurah(s) {
    var next = s < 114 ? pageForSurah(s + 1) - 1 : 604;
    return Math.max(pageForSurah(s), next);
  }
  function isLargeSurah(s) { return lastPageOfSurah(s) > pageForSurah(s); }

  /* ---------------- لوح unit ids: "s12" = whole surah 12, "s2:1-50" = ayahs
     1-50 of surah 2. Parsed/built here once so lawhData/lawhView/hideView all
     agree on the same shape instead of re-deriving it in three places. ---- */
  function unitId(s, from, to) { return (from == null) ? ("s" + s) : ("s" + s + ":" + from + "-" + to); }
  function parseUnitId(id) {
    var m = /^s(\d+)(?::(\d+)-(\d+))?$/.exec(String(id || ""));
    if (!m) return null;
    var s = Number(m[1]), surah = QURAN && QURAN.surahs[s - 1];
    var ayahCount = surah ? surah.ayahCount : 0;
    var whole = !m[2];
    return { s: s, from: whole ? 1 : Number(m[2]), to: whole ? ayahCount : Number(m[3]), whole: whole };
  }
  function unitAyahs(u) {
    if (!QURAN) return [];
    var surah = QURAN.surahs[u.s - 1]; if (!surah) return [];
    var out = [];
    for (var a = u.from; a <= u.to; a++) out.push({ surah: u.s, surahName: surah.name, ayah: a, text: surah.verses[a - 1].text });
    return out;
  }
  function unitLabel(u) {
    var surah = QURAN && QURAN.surahs[u.s - 1], name = surah ? surah.name : ("سورة " + arNum(u.s));
    return u.whole ? name : (name + " (آية " + arNum(u.from) + "-" + arNum(u.to) + ")");
  }
  function pageForUnit(u) { return pageForAyah(u.s, u.from); }

  /* ---------------- quran tab sub-navigation ---------------- */
  // Mirrors the state.lv sub-view pattern used throughout the Learn tab: a small
  // mode object drives which sub-screen renders inside the same tab panel.
  function quranSubNavHTML() {
    var m = (state.qv && state.qv.mode) || "wird";
    return '<div class="seg2" style="margin-block-end:14px">' +
      '<button data-act="qv" data-m="wird" aria-pressed="' + (m === "wird") + '">وردي</button>' +
      '<button data-act="qv" data-m="mushaf" aria-pressed="' + (m === "mushaf") + '">المصحف</button>' +
      '<button data-act="qv" data-m="lawh" aria-pressed="' + (m === "lawh") + '">اللوح</button></div>';
  }
  function quranView(now) {
    if (!state.qv) state.qv = { mode: "wird" };
    var m = state.qv.mode;
    if (m === "mushaf") return quranSubNavHTML() + mushafView(now);
    if (m === "lawh") return quranSubNavHTML() + lawhView(now);
    if (m === "hide") return hideView(now);
    return quranSubNavHTML() + wirdView(now);
  }

  function wirdView(now) {
    var S = state.settings, u = UNITS[S.unit] || UNITS.page, t = target(), n = pagesOn(now.key);
    var tot = totalPages(), absolute = (S.startPage - 1) + tot, cur = (absolute % 604) + 1, khat = Math.floor(absolute / 604);
    var remain = 604 - (cur - 1), eta = Math.ceil(remain / t), wk = "", i, max = t;
    var days = [], weekAllZero = true;
    for (i = 6; i >= 0; i--) { var k = addDays(now.key, -i); var v = pagesOn(k); days.push({ k: k, v: v }); if (v > max) max = v; if (v > 0) weekAllZero = false; }
    days.forEach(function (d) {
      wk += '<div><span class="col"><i class="' + (d.v >= t ? "full" : "") + '" style="height:' + Math.round(d.v / max * 100) + '%"></i></span><b class="num" style="font-weight:500">' + d.v + "</b><span>" + WD_S[dowOf(d.k)] + "</span></div>";
    });
    var opts = Object.keys(UNITS).map(function (k) { return '<button data-act="unit" data-u="' + k + '" aria-pressed="' + (S.unit === k) + '">' + UNITS[k].n + "</button>"; }).join("");
    // One continuous 1→604 bar with a marker at the current position, instead of a bare
    // "وصلت لصفحة" number — "where am I in the whole Quran" reads faster as a single bar
    // than as a stat tile among four others.
    var khatmaPct = Math.max(0, Math.min(100, Math.round(((cur - 1) / 604) * 100)));
    var khatmaHTML = '<div class="card"><h3 style="margin:0 0 10px">الختمة الحالية</h3>' +
      '<div class="bar khatma"><i style="width:' + khatmaPct + '%"></i></div>' +
      '<p class="muted" style="font-size:13px;margin-block-start:10px">الجزء ' + juzOf(cur) + ' · باقي ' + eta + ' يوم بالمعدل الحالي</p></div>';
    return head(now) +
      '<div class="card"><div class="row between"><h2>وردي اليوم</h2><span class="chip num">' + n + " / " + t + ' صفحة</span></div>' +
      '<div class="bar"><i style="width:' + Math.min(100, Math.round(n / t * 100)) + '%"></i></div>' +
      '<div class="row wrapr" style="margin-block-start:12px"><button class="btn sm" data-act="pg" data-n="1">+1 صفحة</button><button class="btn sm" data-act="pg" data-n="5">+5</button><button class="btn sm" data-act="pg" data-n="10">+10</button>' +
      '<button class="btn sm alt" data-act="pgdone">أتممت وردي</button><button class="btn sm alt" data-act="pg" data-n="-1">−1</button></div></div>' +
      khatmaHTML +
      '<div class="stats"><div class="stat"><b class="num">' + khat + '</b><span>ختمات مكتملة</span></div>' +
      '<div class="stat"><b class="num">' + tot + '</b><span>مجموع الصفحات المقروءة</span></div></div>' +
      '<div class="card"><h3>آخر 7 أيام</h3>' + (weekAllZero
        ? '<p class="muted" style="font-size:14px;margin-block-start:8px">لسه مفيش وِرد مسجّل آخر 7 أيام.</p>'
        : '<div class="week">' + wk + "</div>") + "</div>" +
      '<div class="card"><h2>إعداد الورد</h2><div class="seg2">' + opts + "</div>" +
      '<div class="field">الكمية اليومية (' + u.n + ")<div class=\"stepper\"><button class=\"btn sm alt\" data-act=\"amt\" data-n=\"-1\">−</button><b class=\"num\">" + S.amount + "</b><button class=\"btn sm alt\" data-act=\"amt\" data-n=\"1\">+</button><span class=\"muted\">= " + t + " صفحة</span></div></div>" +
      '<label class="field">بدأت من صفحة<input type="number" id="startpage" min="1" max="604" value="' + S.startPage + '" inputmode="numeric"></label></div>';
  }

  /* ---------------- mushaf (Quran reader) ---------------- */
  function mushafView(now) {
    if (!QURAN) {
      return head(now) + '<div class="card"><h3 style="margin:0 0 6px">المصحف الشريف</h3>' +
        '<p class="muted" style="font-size:14px">جاري تحميل نص القرآن…</p></div>';
    }
    var p = state.qv.page;
    if (!p) {
      var rows = QURAN.surahs.map(function (s, i) {
        var num = i + 1;
        return '<button class="surah-row" data-act="mushaf-open" data-s="' + num + '">' +
          '<span class="surah-num">' + arNum(num) + '</span>' +
          '<span class="surah-name">' + esc(s.name) + '</span>' +
          '<span class="muted" style="font-size:12px">' + arNum(s.ayahCount) + ' آية</span></button>';
      }).join("");
      return head(now) +
        '<div class="card"><h3 style="margin:0 0 4px">المصحف الشريف</h3>' +
        '<p class="muted" style="font-size:12px">' + esc(QURAN.source) + "</p></div>" +
        '<div class="card surah-list" style="padding:6px">' + rows + "</div>";
    }
    // A real printed-Mushaf page, not an endless per-surah scroll — exactly the
    // ayahs QURAN.pageStart puts on page p (pageAyahs), one page at a time, with
    // prev/next navigation. A page can open mid-surah or span two surahs, so each
    // ayah is tagged with its own surah name whenever that surah changes within
    // the page rather than assuming one surah heading for the whole page.
    p = Math.max(1, Math.min(604, p));
    var ayahs = pageAyahs(p), lastSurah = null, body = "";
    ayahs.forEach(function (v) {
      if (v.surah !== lastSurah) {
        body += '<div class="pt-line" style="font-weight:600;margin-block-start:' + (lastSurah ? "14px" : "0") + '">﴾ ' + esc(v.surahName) + " ﴿</div>";
        lastSurah = v.surah;
      }
      body += '<span class="ayah">' + esc(quranDisplayText(v.text)) + ' <span class="ayah-n">﴿' + arNum(v.ayah) + "﴾</span></span> ";
    });
    var juz = juzOf(p);
    return '<button class="linkbtn" data-act="mushaf-close">← كل السور</button>' +
      '<div class="card"><div class="row between"><h2 style="margin:0">صفحة ' + arNum(p) + '</h2><span class="chip">الجزء ' + arNum(juz) + "</span></div>" +
      '<p class="ayah-block" style="margin-block-start:10px">' + body + "</p>" +
      '<p class="muted" style="font-size:11px;margin-block-start:14px">' + esc(QURAN.source) + "</p></div>" +
      '<div class="row between" style="margin-block-start:4px">' +
      '<button class="btn sm alt" data-act="mushaf-next" data-p="' + p + '"' + (p >= 604 ? " disabled" : "") + '>الصفحة التالية ←</button>' +
      '<button class="btn sm alt" data-act="mushaf-prev" data-p="' + p + '"' + (p <= 1 ? " disabled" : "") + '>→ الصفحة السابقة</button>' +
      "</div>";
  }

  /* ---------------- لوح الحفظ (lawh) view ---------------- */
  function lawhStatusLabel(st) { return st === 2 ? "محفوظة" : (st === 1 ? "قيد الحفظ" : "غير محفوظة"); }
  function lawhView(now) {
    if (!QURAN) {
      return head(now) + '<div class="card"><h3 style="margin:0 0 6px">اللوح — متابعة الحفظ</h3>' +
        '<p class="muted" style="font-size:14px">جاري تحميل نص القرآن…</p></div>';
    }
    if (state.qv.lawhSurah) return lawhSurahView(now, state.qv.lawhSurah);

    var L = lawhData(), key = now.key, memorizedSurahs = 0, memorizing = 0, dueToday = [];
    Object.keys(L.units).forEach(function (id) {
      var c = L.units[id], u = parseUnitId(id); if (!u) return;
      if (c.status === 2) { memorizedSurahs++; if (c.due <= key) dueToday.push({ id: id, u: u, due: c.due }); }
      else if (c.status === 1) memorizing++;
    });
    dueToday.sort(function (a, b) { return a.due < b.due ? -1 : (a.due > b.due ? 1 : 0); });
    var dueHTML = dueToday.length
      ? dueToday.map(function (d) {
        return '<div class="azcard" style="padding:12px 16px"><div class="row between"><b>' + esc(unitLabel(d.u)) + '</b></div>' +
          '<div class="row wrapr" style="margin-block-start:8px"><button class="btn sm alt" data-act="lawh-hide" data-u="' + d.id + '">تسميع (إخفاء النص)</button>' +
          '<button class="btn sm" data-act="lawh-rev" data-u="' + d.id + '" data-g="1">تمت المراجعة</button>' +
          '<button class="btn sm alt" data-act="lawh-rev" data-u="' + d.id + '" data-g="0">نسيتها</button></div></div>';
      }).join("")
      : '<p class="muted" style="font-size:14px">لا توجد مراجعات مستحقة اليوم، الحمد لله.</p>';

    var rows = QURAN.surahs.map(function (s, i) {
      var num = i + 1, id = unitId(num), c = L.units[id], st = c ? c.status : 0;
      var large = isLargeSurah(num);
      return '<button class="surah-row" data-act="lawh-open" data-s="' + num + '">' +
        '<span class="surah-num">' + arNum(num) + '</span>' +
        '<span class="surah-name">' + esc(s.name) + (large ? ' <span class="muted" style="font-size:11px">(طويلة)</span>' : "") + "</span>" +
        '<span class="chip ' + (st === 2 ? "on" : "") + '" style="font-size:11px">' + lawhStatusLabel(st) + "</span></button>";
    }).join("");

    return head(now) +
      '<div class="card"><h3 style="margin:0 0 10px">اللوح — متابعة الحفظ</h3>' +
      '<p class="muted" style="font-size:13px">' + arNum(memorizedSurahs) + ' وحدة محفوظة · ' + arNum(memorizing) + " قيد الحفظ</p></div>" +
      '<div class="card"><div class="row between"><h3 style="margin:0">مراجعات اليوم</h3><span class="chip">' + arNum(dueToday.length) + "</span></div>" +
      '<div style="margin-block-start:10px">' + dueHTML + "</div></div>" +
      '<p class="muted" style="font-size:13px;margin-block-end:8px">اضغط على أي سورة لتفتح حالتها: غير محفوظة ← قيد الحفظ ← محفوظة. السور الطويلة (أكتر من صفحة مصحف) تقدر كمان تقسّمها لنطاقات آيات تحفظها على مراحل.</p>' +
      '<div class="card surah-list" style="padding:6px">' + rows + "</div>";
  }

  // Opened by tapping any surah in the list above. Always shows the whole-surah
  // unit (works standalone for short surahs); a "large" surah additionally gets
  // an ayah-range picker so it can be memorized in checkpoints instead of one
  // all-or-nothing block.
  function lawhSurahView(now, s) {
    var surah = QURAN.surahs[s - 1];
    if (!surah) { state.qv.lawhSurah = null; return lawhView(now); }
    var L = lawhData(), wholeId = unitId(s), whole = L.units[wholeId] || { status: 0 };
    var last = lastSelfCheckFor(wholeId);
    var wholeCard = '<div class="azcard"><div class="row between"><b>السورة كاملة</b><span class="chip' + (whole.status === 2 ? " on" : "") + '">' + lawhStatusLabel(whole.status) + "</span></div>" +
      (last ? '<p class="muted" style="font-size:12px;margin-block-start:6px">آخر تسميع: احتجت تكشف ' + arNum(last.revealed) + " من " + arNum(last.total) + " آية</p>" : "") +
      '<div class="row wrapr" style="margin-block-start:10px">' +
      '<button class="btn sm" data-act="lawh-tap" data-u="' + wholeId + '">' + (whole.status === 0 ? "ابدأ الحفظ" : whole.status === 1 ? "تم الحفظ" : "إعادة ضبط") + "</button>" +
      '<button class="btn sm alt" data-act="lawh-hide" data-u="' + wholeId + '">تسميع (إخفاء النص)</button>' +
      (whole.status === 2 ? '<button class="btn sm alt" data-act="lawh-rev" data-u="' + wholeId + '" data-g="1">تمت المراجعة</button><button class="btn sm alt" data-act="lawh-rev" data-u="' + wholeId + '" data-g="0">نسيتها</button>' : "") +
      '<button class="linkbtn" data-act="lawh-goto-mushaf" data-u="' + wholeId + '">📖 افتح في المصحف</button>' +
      "</div></div>";

    var rangesHTML = "";
    if (isLargeSurah(s)) {
      var rangeIds = Object.keys(L.units).filter(function (id) { var u = parseUnitId(id); return u && u.s === s && !u.whole; });
      var rangeCells = rangeIds.map(function (id) {
        var u = parseUnitId(id), c = L.units[id];
        return '<div class="azcard" style="padding:10px 14px"><div class="row between">' +
          '<button class="linkbtn" data-act="lawh-tap" data-u="' + id + '" style="font-weight:600">آية ' + arNum(u.from) + "-" + arNum(u.to) + " — " + lawhStatusLabel(c.status) + "</button>" +
          '<button class="linkbtn" style="color:var(--bad)" data-act="lawh-remove" data-u="' + id + '">حذف</button></div>' +
          '<div class="row wrapr" style="margin-block-start:6px">' +
          '<button class="btn sm alt" data-act="lawh-hide" data-u="' + id + '">تسميع</button>' +
          (c.status === 2 ? '<button class="btn sm alt" data-act="lawh-rev" data-u="' + id + '" data-g="1">تمت المراجعة</button><button class="btn sm alt" data-act="lawh-rev" data-u="' + id + '" data-g="0">نسيتها</button>' : "") +
          "</div></div>";
      }).join("");
      rangesHTML = '<div class="card"><h3 style="margin:0 0 8px">نطاقات (اختياري)</h3>' +
        '<p class="muted" style="font-size:13px">السورة دي ' + arNum(surah.ayahCount) + ' آية — تقدر تحفظها على أجزاء بدل ما تستنى تخلّصها كلها.</p>' +
        (rangeCells || "") +
        '<div class="row wrapr" style="margin-block-start:10px;align-items:end">' +
        '<label class="field" style="flex:1;min-width:90px">من آية<input type="number" id="lawhFrom" min="1" max="' + surah.ayahCount + '" placeholder="1"></label>' +
        '<label class="field" style="flex:1;min-width:90px">إلى آية<input type="number" id="lawhTo" min="1" max="' + surah.ayahCount + '" placeholder="' + arNum(surah.ayahCount) + '"></label>' +
        '<button class="btn sm" data-act="lawh-add-range" data-s="' + s + '">إضافة نطاق</button>' +
        "</div></div>";
    }

    return '<button class="linkbtn" data-act="lawh-close">← كل السور</button>' +
      '<div class="card"><h3 style="margin:0 0 4px">' + esc(surah.name) + '</h3><p class="muted" style="font-size:12px">' + arNum(surah.ayahCount) + " آية</p></div>" +
      wholeCard + rangesHTML;
  }

  /* ---------------- استماع ذكي (Beta) — word-matching mistake detector ---------------- */
  // Compares what the browser's speech recognizer heard against the verified ayah
  // text, word by word, after stripping tashkeel/punctuation. This is NOT tajweed
  // judgment and Arabic speech recognition accuracy varies a lot by device/accent —
  // the UI must say so plainly (see the Beta note rendered in hideView below).
  var smartRec = null;
  function smartListenSupported() { return !!(window.SpeechRecognition || window.webkitSpeechRecognition); }
  function normalizeAr(s) {
    return String(s)
      .replace(/[ً-ٟؐ-ؚۖ-ٰۭـ]/g, "")
      // ٱ (Alef Wasla) is how the Quran text spells a plain connecting alef
      // at the start of words like اللّه (Allah) -- it falls outside the letter
      // range kept just below, so without this fold it was being silently
      // DELETED from the target ayah text while recognized speech comes back
      // with an ordinary alef. That one missing letter broke the word match
      // on almost every ayah (Alef Wasla is extremely common in Quranic
      // spelling), which is why reciting correctly never registered.
      .replace(/ٱ/g, "ا")
      // Hamza-bearing alef forms (آ/أ/إ) and teh marbuta (ة) are also
      // spelled one way in careful Quranic orthography and often another way (or
      // dropped) in a speech-recognized transcript -- folding them the same way
      // on both sides keeps the comparison about the WORDS, not the exact hamza
      // seat, which this beta aid was never meant to judge (see the UI disclaimer).
      .replace(/[آأإ]/g, "ا")
      .replace(/ة/g, "ه")
      .replace(/[^ء-ي\s]/g, "")
      .replace(/\s+/g, " ").trim();
  }
  function wordMatchRatio(target, heard) {
    var tW = normalizeAr(target).split(" ").filter(Boolean), hW = normalizeAr(heard).split(" ").filter(Boolean);
    if (!tW.length) return 0;
    var hi = 0, matched = 0;
    for (var i = 0; i < tW.length; i++) {
      var found = -1;
      for (var j = hi; j < hW.length; j++) { if (hW[j] === tW[i]) { found = j; break; } }
      if (found >= 0) { matched++; hi = found + 1; }
    }
    return matched / tW.length;
  }
  function onSmartHeard(transcript) {
    var u = parseUnitId(state.qv.hideUnit); if (!u) return;
    var ayahs = unitAyahs(u), idx = state.qv.listenIdx || 0;
    if (idx >= ayahs.length) return;
    if (wordMatchRatio(ayahs[idx].text, transcript) >= 0.6) {
      state.qv.revealed[idx] = true; state.qv.listenIdx = idx + 1; render();
    }
  }
  function startSmartListen() {
    if (!smartListenSupported()) { toast("الاستماع الذكي غير متاح في هذا المتصفح"); return; }
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    try {
      smartRec = new SR();
      smartRec.lang = "ar-SA"; smartRec.continuous = true; smartRec.interimResults = true;
      smartRec.onresult = function (e) {
        var transcript = ""; for (var i = e.resultIndex; i < e.results.length; i++) transcript += e.results[i][0].transcript + " ";
        onSmartHeard(transcript);
      };
      smartRec.onerror = function (e) { toast("تعذر الاستماع: " + (e && e.error || "")); stopSmartListen(); };
      smartRec.onend = function () { if (state.qv.listening) { try { smartRec.start(); } catch (e2) { } } };
      smartRec.start();
      state.qv.listening = true; state.qv.listenIdx = state.qv.listenIdx || 0; render();
    } catch (e) { toast("تعذر بدء الاستماع"); }
  }
  function stopSmartListen() {
    state.qv.listening = false;
    if (smartRec) { try { smartRec.onend = null; smartRec.stop(); } catch (e) { } smartRec = null; }
  }

  /* ---------------- تسميع — hide-text self-check ---------------- */
  // Text per ayah comes from pageAyahs(), sliced from the same verified source as
  // the Mushaf reader — nothing here is retyped. Each ayah starts hidden; the
  // person recites from memory and taps only the ones they needed to check, so
  // the reveal count is an honest signal of how solid that page really is.
  function hideView(now) {
    var id = state.qv.hideUnit, u = id && parseUnitId(id);
    if (!QURAN || !u) {
      return head(now) + '<button class="linkbtn" data-act="hide-close">← رجوع للوح</button>' +
        '<div class="card"><h3 style="margin:0 0 6px">تسميع</h3>' +
        '<p class="muted" style="font-size:14px">جاري تحميل نص القرآن…</p></div>';
    }
    var ayahs = unitAyahs(u);
    if (!state.qv.revealed) state.qv.revealed = {};
    // "revealed" only controls whether an ayah's text is showing (by hand, or because
    // the smart listener just heard it recited correctly). "mistaken" is the strictly
    // smaller set revealed BY HAND — a correct recitation isn't a mistake, so it must
    // not inflate the count below (see onSmartHeard, which only ever sets "revealed").
    if (!state.qv.mistaken) state.qv.mistaken = {};
    var rows = ayahs.map(function (v, i) {
      if (state.qv.revealed[i]) {
        return '<div class="hide-row"><span class="ayah">' + esc(quranDisplayText(v.text)) + ' <span class="ayah-n">﴿' + arNum(v.ayah) + "﴾</span></span></div>";
      }
      return '<button class="hide-row hidden" data-act="hide-reveal" data-i="' + i + '">— اضغط لإظهار الآية ' + arNum(v.ayah) + " من " + esc(v.surahName) + " —</button>";
    }).join("");
    // "Mistake" = an ayah you had to check by hand because you couldn't recite it —
    // one count per ayah no matter how many times you re-checked it. An ayah the
    // smart listener revealed because you said it correctly is not a mistake.
    var mistakes = Object.keys(state.qv.mistaken).length;
    var listenRow = state.qv.listening
      ? '<button class="btn sm alt" data-act="listen-stop">إيقاف الاستماع</button><span class="chip on">يستمع الآن…</span>'
      : '<button class="btn sm" data-act="listen-start">تشغيل الاستماع الذكي (تجريبي)</button>';
    return head(now) + '<button class="linkbtn" data-act="hide-close">← رجوع للوح</button>' +
      '<div class="card"><div class="row between"><h2 style="margin:0">تسميع ' + esc(unitLabel(u)) + '</h2><span class="chip' + (mistakes ? "" : " on") + '">' + arNum(mistakes) + " غلطة من " + arNum(ayahs.length) + '</span></div>' +
      '<p class="muted" style="font-size:13px;margin-block-start:6px">اقرأ غيبًا، واضغط فقط عند الحاجة للتأكد من آية — كل آية تلمسها بإيدك تتحسب غلطة. مع الاستماع الذكي، الآية اللي تقرأها صح بتتكشف لوحدها من غير ما تتحسب غلطة.</p>' +
      '<div class="row wrapr" style="margin-block-start:10px">' + listenRow + "</div>" +
      '<p class="muted" style="font-size:11px;margin-block-start:8px">ميزة تجريبية (Beta): تطابق فقط الكلمات المسموعة بالكلمات المكتوبة، ولا تحكم على التجويد أو الضبط، ودقة التعرف على الصوت العربي محدودة وتختلف حسب الجهاز — استخدمها كمساعد لا كحَكَم نهائي.</p></div>' +
      '<div class="card" style="display:flex;flex-direction:column;gap:8px">' + rows + "</div>" +
      '<button class="btn" style="width:100%;margin-block-start:10px" data-act="hide-finish">انتهيت من التسميع</button>';
  }
