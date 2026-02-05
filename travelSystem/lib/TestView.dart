
import 'package:flutter/cupertino.dart';
import 'package:get/get.dart';
import 'package:get/get_core/src/get_main.dart';
import 'package:flutter/material.dart';


import 'core/classes/StatusRequest.dart';
import 'core/controllers/test/test_controller.dart';
import 'core/constants/Color.dart';
import 'core/constants/images.dart';

class testview extends StatefulWidget {
  const testview({super.key});

  @override
  State<testview> createState() => _testviewState();
}

class _testviewState extends State<testview> {
  @override
  Widget build(BuildContext context) {
    TestDataCintroller controller=Get.put(TestDataCintroller());
    return Scaffold(
      appBar: AppBar(
        title: Text('بيانات المستخدمين'),
        centerTitle: true,
      ),
      body: SafeArea(

        child: GetBuilder<TestDataCintroller>(
          builder:  (controller) {
            if(controller.statRequst==StatRequst.Loding){
              return Center(child:  Image(image: AssetImage(AppImage.image_setting_active)));
            }
            else if(controller.statRequst==StatRequst.serverfielure){
              return Center(child:  Image(image: AssetImage(AppImage.image_ops_server)));
            }
            else if(controller.statRequst==StatRequst.oflinefielure){
              return Center(child:  Image(image: AssetImage(AppImage.image_forget)));
            }

            else{
              return ListView.builder(
                itemCount: controller.data.length,
                itemBuilder: (context, index) {
                  var view=controller.data[index];
                  return Container(
                    margin: EdgeInsets.symmetric(horizontal: 10,vertical: 10),
                    decoration: BoxDecoration(
                        color:AppColor.color_primary,
                        borderRadius: BorderRadius.vertical(top: Radius.circular(20),bottom: Radius.circular(20))
                    ),
                    child:ListTile(
                      leading: Icon(Icons.account_circle,color: AppColor.color_primary,size: 50),
                      title:Text( view['full_name'],style: TextStyle(fontSize: 25,color: AppColor.color_secondary)),
                      subtitle:Text( view['email'],style: TextStyle(fontSize: 15)),
                      trailing: Container(
                        width: 60,
                        child: Row(
                          children: [
                            Icon(Icons.delete_rounded),
                            SizedBox(width: 10,),
                            Icon(Icons.note_alt_sharp)
                          ],
                        ),
                      ),
                    ) ,
                  );
                },);
            }
          },),
      ),
    );
  }
}
