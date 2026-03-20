from __future__ import annotations

import types

from app.config import settings
from app.services.camera_service import CameraService


class _FakePicam:
    def __init__(self, camera_controls: dict[str, object]):
        self.camera_controls = camera_controls
        self.last_controls: dict[str, object] | None = None

    def set_controls(self, payload: dict[str, object]) -> None:
        self.last_controls = payload


def _install_fake_libcamera(monkeypatch):
    fake_controls = types.SimpleNamespace(
        AfModeEnum=types.SimpleNamespace(Auto=1, Continuous=2, Manual=3),
        AfTriggerEnum=types.SimpleNamespace(Start=99),
    )
    fake_module = types.SimpleNamespace(controls=fake_controls)
    monkeypatch.setitem(__import__("sys").modules, "libcamera", fake_module)


def test_focus_controls_marked_unsupported_without_af_mode(monkeypatch):
    svc = CameraService()
    svc._picam2 = _FakePicam(camera_controls={"ExposureTime": (1, 2, 3)})

    svc._configure_picamera2_focus()

    assert svc.focus_supported is False
    assert svc.focus_mode_applied == "unsupported"
    assert svc._picam2.last_controls is None


def test_focus_continuous_mode_applies_af_controls(monkeypatch):
    _install_fake_libcamera(monkeypatch)
    monkeypatch.setattr(settings, "camera_autofocus_mode", "CONTINUOUS")

    svc = CameraService()
    svc._picam2 = _FakePicam(camera_controls={"AfMode": (0, 1, 2)})

    svc._configure_picamera2_focus()

    assert svc.focus_supported is True
    assert svc.focus_mode_applied == "CONTINUOUS"
    assert svc._picam2.last_controls == {"AfMode": 2}


def test_focus_manual_mode_applies_lens_position(monkeypatch):
    _install_fake_libcamera(monkeypatch)
    monkeypatch.setattr(settings, "camera_autofocus_mode", "MANUAL")
    monkeypatch.setattr(settings, "camera_lens_position", 7.5)

    svc = CameraService()
    svc._picam2 = _FakePicam(camera_controls={"AfMode": (0, 1, 2), "LensPosition": (0.0, 32.0, 1.0)})

    svc._configure_picamera2_focus()

    assert svc.focus_supported is True
    assert svc.focus_mode_applied == "MANUAL"
    assert svc._picam2.last_controls == {"AfMode": 3, "LensPosition": 7.5}
