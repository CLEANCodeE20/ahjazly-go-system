import 'package:get/get.dart';

import '../../classes/StatusRequest.dart';
import '../../data/remote/testData.dart';
import '../../functions/handlingData.dart';


class TestDataCintroller extends GetxController{

  TestData dataTest=TestData();
  List data = [];
  StatRequst statRequst = StatRequst.Loding;

  Future<void> getdata() async {
    statRequst = StatRequst.Loding;
    update();
    var response = await dataTest.getdata();
    statRequst = handlingData(response);
    if (statRequst == StatRequst.succes) {
      data.clear();
      data.addAll(response);
    }
    update();
  }


  @override
  void onInit() {
    getdata();
    super.onInit();
  }

}