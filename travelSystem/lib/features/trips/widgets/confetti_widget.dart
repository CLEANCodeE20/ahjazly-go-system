import 'dart:math';
import 'package:flutter/material.dart';

class ConfettiWidget extends StatefulWidget {
  final Widget child;
  final bool isPlaying;

  const ConfettiWidget({
    Key? key,
    required this.child,
    required this.isPlaying,
  }) : super(key: key);

  @override
  _ConfettiWidgetState createState() => _ConfettiWidgetState();
}

class _ConfettiWidgetState extends State<ConfettiWidget> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  final List<ConfettiParticle> _particles = [];
  final Random _random = Random();

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..addListener(() {
        setState(() {
          for (var particle in _particles) {
            particle.update();
          }
        });
      });
  }

  @override
  void didUpdateWidget(ConfettiWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isPlaying && !oldWidget.isPlaying) {
      _startConfetti();
    }
  }

  void _startConfetti() {
    _particles.clear();
    for (int i = 0; i < 50; i++) {
        _particles.add(ConfettiParticle(_random));
    }
    _controller.forward(from: 0);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        widget.child,
        if (widget.isPlaying)
          Positioned.fill(
            child: IgnorePointer(
              child: CustomPaint(
                painter: ConfettiPainter(_particles),
              ),
            ),
          ),
      ],
    );
  }
}

class ConfettiParticle {
  late double x;
  late double y;
  late double size;
  late Color color;
  late double velocityX;
  late double velocityY;
  late double rotation;
  late double rotationSpeed;

  ConfettiParticle(Random random) {
    x = random.nextDouble() * 300 + 50; // Approximated center start x
    y = -50;
    size = random.nextDouble() * 10 + 5;
    color = [Colors.red, Colors.blue, Colors.green, Colors.yellow, Colors.purple, Colors.orange][random.nextInt(6)];
    velocityX = (random.nextDouble() - 0.5) * 5;
    velocityY = random.nextDouble() * 5 + 2;
    rotation = random.nextDouble() * pi * 2;
    rotationSpeed = (random.nextDouble() - 0.5) * 0.2;
  }

  void update() {
    x += velocityX;
    y += velocityY;
    rotation += rotationSpeed;
    velocityY += 0.1; // Gravity
  }
}

class ConfettiPainter extends CustomPainter {
  final List<ConfettiParticle> particles;

  ConfettiPainter(this.particles);

  @override
  void paint(Canvas canvas, Size size) {
    for (var particle in particles) {
      final paint = Paint()..color = particle.color;
      canvas.save();
      canvas.translate(particle.x, particle.y);
      canvas.rotate(particle.rotation);
      canvas.drawRect(Rect.fromCenter(center: Offset.zero, width: particle.size, height: particle.size * 0.6), paint);
      canvas.restore();
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}
