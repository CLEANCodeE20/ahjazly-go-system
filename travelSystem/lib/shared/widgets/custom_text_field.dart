
import 'package:flutter/material.dart';

import '../../core/constants/Color.dart';

class CostamTextFilde extends StatelessWidget {
  final String hintText;
  final IconData prefixIcon;
  final String? Function(String?)validator;
  final TextEditingController? MyController;
  final TextInputType? TypeText;
  final  bool? statusinput;
  final void Function()? onTapIcon;
   CostamTextFilde({super.key,
     required this.hintText,
     required this.prefixIcon,
     required this.validator,
     this.TypeText,
      this.statusinput,
      this.MyController, this.onTapIcon}
       );
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(10.0),
      child: TextFormField(
        controller:MyController,
        keyboardType: TypeText,
        obscureText: statusinput==null||statusinput==false ? false:true,
        decoration: InputDecoration(
          hintText: hintText,
          hintStyle:  TextStyle(color: Colors.black87),
          prefixIcon:  InkWell(
            onTap: onTapIcon,
              child: Icon(prefixIcon,size: 30)
          ),
          prefixIconColor:  AppColor.color_primary,
          focusedBorder: OutlineInputBorder(
              borderSide:  BorderSide(color: AppColor.color_primary,width: 3,),borderRadius: BorderRadius.circular(18)
          ),
          border: OutlineInputBorder(
            borderSide:  BorderSide(color: AppColor.color_accent),
            borderRadius: BorderRadius.circular(16),
          ),
        ),

        validator: validator,
      ),
    );
  }
}
