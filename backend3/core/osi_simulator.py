"""Simulates data transformation across the 7 OSI layers."""
import base64
import json
import uuid
from datetime import datetime


def layer_7_application(message: str, protocol: str = "http") -> dict:
    """Layer 7: Application - Raw user data."""
    return {
        "layer": 7,
        "name": "Application",
        "data": message,
        "headers_added": {"protocol": protocol.upper()},
        "description": "User application data (e.g. HTTP body, SMTP message)",
    }


def layer_6_presentation(data: str) -> dict:
    """Layer 6: Presentation - Encoding, compression."""
    encoded = base64.b64encode(data.encode("utf-8")).decode("ascii")
    return {
        "layer": 6,
        "name": "Presentation",
        "data": encoded,
        "headers_added": {"encoding": "base64", "charset": "utf-8"},
        "description": "Data encoded for secure transmission across network",
    }


def layer_5_session(data: str) -> dict:
    """Layer 5: Session - Session management."""
    session_id = f"sess_{uuid.uuid4().hex[:12]}"
    payload = json.dumps({"session_id": session_id, "timestamp": datetime.utcnow().isoformat() + "Z", "payload": data})
    return {
        "layer": 5,
        "name": "Session",
        "data": payload,
        "headers_added": {"session_id": session_id},
        "description": "Session metadata added for dialog control",
    }


def layer_4_transport(data: str) -> dict:
    """Layer 4: Transport - TCP segmentation, ports."""
    return {
        "layer": 4,
        "name": "Transport",
        "data": data,
        "headers_added": {
            "src_port": 49152,
            "dst_port": 80,
            "seq_num": 1000,
            "ack_num": 0,
            "checksum": "0x1a2b",
            "flags": "PSH, ACK",
        },
        "description": "TCP header: source/dest ports, sequence, checksum",
    }


def layer_3_network(data: str) -> dict:
    """Layer 3: Network - IP routing."""
    return {
        "layer": 3,
        "name": "Network",
        "data": data,
        "headers_added": {
            "src_ip": "192.168.1.10",
            "dst_ip": "93.184.216.34",
            "ttl": 64,
            "protocol": "TCP",
        },
        "description": "IP header: logical addressing, TTL, protocol",
    }


def layer_2_datalink(data: str) -> dict:
    """Layer 2: Data Link - Ethernet framing."""
    return {
        "layer": 2,
        "name": "Data Link",
        "data": data,
        "headers_added": {
            "src_mac": "AA:BB:CC:DD:EE:01",
            "dst_mac": "00:11:22:33:44:55",
            "ethertype": "0x0800 (IPv4)",
        },
        "description": "Ethernet frame: MAC addresses, frame type",
    }


def layer_1_physical(data: str) -> dict:
    """Layer 1: Physical - Bits, electrical signals."""
    binary_parts = [f"{ord(c):08b}" for c in data[:64]]  # limit for display
    if len(data) > 64:
        binary_parts.append("...")
    binary = " ".join(binary_parts)
    return {
        "layer": 1,
        "name": "Physical",
        "data": binary,
        "headers_added": None,
        "description": "Bits: electrical/signal representation on the wire",
    }


def simulate_encapsulation(message: str, protocol: str = "http") -> list[dict]:
    """Simulate data flowing down the OSI stack (encapsulation)."""
    layers = []
    current = message

    # Layer 7
    l7 = layer_7_application(message, protocol)
    layers.append(l7)
    current = l7["data"]

    # Layer 6
    l6 = layer_6_presentation(current)
    layers.append(l6)
    current = l6["data"]

    # Layer 5
    l5 = layer_5_session(current)
    layers.append(l5)
    current = l5["data"]

    # Layer 4
    l4 = layer_4_transport(current)
    layers.append(l4)
    current = l4["data"]

    # Layer 3
    l3 = layer_3_network(current)
    layers.append(l3)
    current = l3["data"]

    # Layer 2
    l2 = layer_2_datalink(current)
    layers.append(l2)
    current = l2["data"]

    # Layer 1
    l1 = layer_1_physical(current)
    layers.append(l1)

    return layers


def get_summary(layers: list[dict], message: str) -> dict:
    """Compute summary stats."""
    app_data = layers[0]["data"] if layers else ""
    phys_data = layers[-1]["data"] if layers else ""
    return {
        "total_bytes_app": len(message.encode("utf-8")),
        "total_bits_physical": len(phys_data.replace(" ", "").replace(".", "")),
        "layers_processed": len(layers),
    }
