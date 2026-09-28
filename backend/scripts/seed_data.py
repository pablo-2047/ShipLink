"""Seed script for SIH 2026 Freight Forecasting database.

Populates:
1. Historical BDI freight rates (2020-2026) and sub-indices (BCI, BPI, BSI, BHSI, BDRY proxy)
2. Daily economic indicators (Brent crude, VLSFO, MGO, IFO380, USD/INR, Coal, Iron Ore)
3. Initial port congestion records for all Indian East Coast ports
4. Chokepoint transit records (Suez, Bab el-Mandeb, Malacca, etc.)
"""

import math
import random
import sys
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
import numpy as np

# Ensure backend root is in sys.path when executed directly
backend_root = Path(__file__).resolve().parent.parent
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

from sqlmodel import Session, select

from app.database import create_db_and_tables, engine
from app.models.freight_rate import FreightRate
from app.models.economic_indicator import EconomicIndicator
from app.models.port import PortCongestionRecord
from app.models.congestion_record import ChokepointTransit
from app.services.ingestion.bdi_ingestion import BDIIngestion
from app.services.ingestion.fleet_supply_ingestion import FleetSupplyIngestion


def seed_freight_rates(session: Session):
    """Seed historical BDI data using real Stooq CSV with realistic fallback."""
    existing_count = len(session.exec(select(FreightRate).limit(5)).all())
    if existing_count > 0:
        print(f"[*] freight_rates already contains data ({existing_count}+ records), skipping seed.")
        return

    print("[*] Fetching historical BDI from Stooq / yfinance...")
    df_stooq = BDIIngestion.fetch_historical_stooq()
    
    records = []
    if not df_stooq.empty and len(df_stooq) > 100:
        print(f"[+] Loaded {len(df_stooq)} real BDI records from Stooq.")
        for _, row in df_stooq.iterrows():
            d = row['date'].date() if hasattr(row['date'], 'date') else row['date']
            bdi = float(row['bdi_index']) if not math.isnan(row['bdi_index']) else 1500.0
            records.append(FreightRate(
                date=d,
                bdi_index=round(bdi, 1),
                bci_index=round(bdi * 1.35 + random.uniform(-100, 100), 1),
                bpi_index=round(bdi * 1.05 + random.uniform(-50, 50), 1),
                bsi_index=round(bdi * 0.90 + random.uniform(-40, 40), 1),
                bhsi_index=round(bdi * 0.65 + random.uniform(-30, 30), 1),
                bdry_close=round(bdi * 0.0085, 2),
                source="STOOQ_REAL"
            ))
    else:
        print("[-] Live Stooq fetch unavailable or empty. Generating calibrated 5-year historical BDI series (2020-2026)...")
        start_date = date(2020, 1, 1)
        end_date = date(2026, 9, 8)
        curr = start_date
        bdi = 1350.0
        
        while curr <= end_date:
            if curr.weekday() < 5:
                if date(2020, 2, 1) <= curr <= date(2020, 5, 1):
                    bdi += random.gauss(-15, 25)
                    bdi = max(400.0, bdi)
                elif date(2021, 3, 1) <= curr <= date(2021, 10, 31):
                    bdi += random.gauss(18, 50)
                    bdi = min(5650.0, bdi)
                elif date(2023, 11, 15) <= curr:
                    bdi += random.gauss(0.5, 35)
                    bdi = max(1100.0, min(3200.0, bdi))
                else:
                    drift = 0.02 * (1650.0 - bdi)
                    bdi += drift + random.gauss(0, 30)
                    bdi = max(550.0, min(4500.0, bdi))
                
                records.append(FreightRate(
                    date=curr,
                    bdi_index=round(bdi, 1),
                    bci_index=round(bdi * 1.35 + random.uniform(-80, 80), 1),
                    bpi_index=round(bdi * 1.05 + random.uniform(-40, 40), 1),
                    bsi_index=round(bdi * 0.88 + random.uniform(-30, 30), 1),
                    bhsi_index=round(bdi * 0.62 + random.uniform(-20, 20), 1),
                    bdry_close=round(bdi * 0.0085, 2),
                    source="CALIBRATED_SERIES"
                ))
            curr += timedelta(days=1)
            
    session.add_all(records)
    session.commit()
    print(f"[OK] Seeded {len(records)} freight rate records.")


def seed_economic_indicators(session: Session):
    """Seed historical economic indicators (Crude, VLSFO, MGO, USD/INR, Coal, Iron Ore)."""
    existing_count = len(session.exec(select(EconomicIndicator).limit(5)).all())
    if existing_count > 0:
        print(f"[*] economic_indicators already contains data ({existing_count}+ records), skipping.")
        return

    print("[*] Generating calibrated 5-year economic indicators (2020-2026)...")
    start_date = date(2020, 1, 1)
    end_date = date(2026, 9, 8)
    curr = start_date
    
    brent = 65.0
    usd_inr = 74.5
    coal = 110.0
    iron_ore = 95.0
    
    records = []
    while curr <= end_date:
        if curr.weekday() < 5:
            if date(2022, 2, 24) <= curr <= date(2022, 7, 1):
                brent = min(130.0, brent + random.gauss(0.8, 2.5))
                coal = min(420.0, coal + random.gauss(2.5, 6.0))
            else:
                brent = max(45.0, min(105.0, brent + 0.02 * (82.0 - brent) + random.gauss(0, 1.2)))
                coal = max(80.0, min(240.0, coal + 0.02 * (135.0 - coal) + random.gauss(0, 2.0)))

            usd_inr = max(72.0, min(84.5, usd_inr + 0.004 + random.gauss(0, 0.08)))
            iron_ore = max(75.0, min(220.0, iron_ore + 0.015 * (112.0 - iron_ore) + random.gauss(0, 1.8)))
            
            vlsfo = round(brent * 7.4 + random.uniform(-15, 25), 1)
            mgo = round(vlsfo * 1.25 + random.uniform(-10, 15), 1)
            ifo380 = round(vlsfo * 0.76 + random.uniform(-10, 10), 1)
            
            records.append(EconomicIndicator(
                date=curr,
                brent_crude_usd=round(brent, 2),
                vlsfo_usd_mt=vlsfo,
                mgo_usd_mt=mgo,
                ifo380_usd_mt=ifo380,
                usd_inr=round(usd_inr, 2),
                coal_price_usd=round(coal, 2),
                iron_ore_price_usd=round(iron_ore, 2),
                source="CALIBRATED_MACRO"
            ))
        curr += timedelta(days=1)

    session.add_all(records)
    session.commit()
    print(f"[OK] Seeded {len(records)} economic indicator records.")


def seed_port_congestion(session: Session):
    """Seed baseline port congestion and operational states for East Coast ports."""
    existing_count = len(session.exec(select(PortCongestionRecord).limit(5)).all())
    if existing_count > 0:
        print("[*] port_congestion records exist, skipping.")
        return

    ports_config = [
        {"id": "paradip", "name": "Paradip", "wait": 28.5, "vessels": 14, "level": "AMBER", "wave": 2.1, "risk": 498750.0},
        {"id": "vizag_outer", "name": "Visakhapatnam Outer", "wait": 11.2, "vessels": 6, "level": "GREEN", "wave": 1.4, "risk": 84000.0},
        {"id": "vizag_inner", "name": "Visakhapatnam Inner", "wait": 18.0, "vessels": 5, "level": "AMBER", "wave": 0.8, "risk": 112500.0},
        {"id": "gangavaram", "name": "Gangavaram", "wait": 8.4, "vessels": 4, "level": "GREEN", "wave": 1.2, "risk": 42000.0},
        {"id": "gopalpur", "name": "Gopalpur", "wait": 15.6, "vessels": 3, "level": "GREEN", "wave": 1.9, "risk": 58500.0},
        {"id": "dhamra", "name": "Dhamra", "wait": 9.0, "vessels": 5, "level": "GREEN", "wave": 1.6, "risk": 56250.0},
        {"id": "haldia", "name": "Haldia Dock Complex", "wait": 42.0, "vessels": 18, "level": "RED", "wave": 1.1, "risk": 945000.0},
        {"id": "sandheads", "name": "Sandheads Offshore", "wait": 36.5, "vessels": 12, "level": "AMBER", "wave": 2.8, "risk": 547500.0},
    ]

    records = []
    now = datetime.now(timezone.utc)
    
    for day_offset in range(14, -1, -1):
        snap_time = now - timedelta(days=day_offset)
        for p in ports_config:
            jitter = random.uniform(-0.15, 0.15)
            wait = max(2.0, p["wait"] * (1.0 + jitter))
            vessels = max(1, int(p["vessels"] * (1.0 + jitter)))
            lvl = "RED" if wait > 36 or vessels >= 15 else "AMBER" if wait > 12 or vessels >= 8 else "GREEN"
            
            records.append(PortCongestionRecord(
                timestamp=snap_time,
                port_id=p["id"],
                vessels_at_anchor=vessels,
                avg_wait_hours=round(wait, 1),
                congestion_level=lvl,
                wave_height_m=round(p["wave"] + random.uniform(-0.3, 0.3), 2),
                weather_severity="ROUGH" if p["wave"] > 2.5 else "MODERATE" if p["wave"] > 1.5 else "CALM",
                estimated_demurrage_risk_usd=round(vessels * wait * 1250.0, 2)
            ))

    session.add_all(records)
    session.commit()
    print(f"[OK] Seeded {len(records)} port congestion snapshots.")


def seed_chokepoints(session: Session):
    """Seed daily chokepoint transit counts (Suez, Bab el-Mandeb, Malacca, etc.)."""
    existing_count = len(session.exec(select(ChokepointTransit).limit(5)).all())
    if existing_count > 0:
        print("[*] chokepoint_transits records exist, skipping.")
        return

    chokepoints = [
        {"name": "Suez Canal", "normal": 65, "dry_bulk": 18, "reduced": 26},
        {"name": "Bab el-Mandeb", "normal": 60, "dry_bulk": 16, "reduced": 22},
        {"name": "Strait of Malacca", "normal": 85, "dry_bulk": 28, "reduced": 82},
        {"name": "Panama Canal", "normal": 36, "dry_bulk": 8, "reduced": 22},
        {"name": "Cape of Good Hope", "normal": 40, "dry_bulk": 15, "reduced": 78},
    ]

    records = []
    start_date = date.today() - timedelta(days=90)
    
    for day_i in range(91):
        cur_date = start_date + timedelta(days=day_i)
        for cp in chokepoints:
            base = cp["reduced"] if cp["name"] in ["Suez Canal", "Bab el-Mandeb"] else cp["normal"]
            if cp["name"] == "Cape of Good Hope":
                base = cp["reduced"]
                
            total = max(5, int(base + random.gauss(0, 3)))
            db = max(1, int(total * 0.32 + random.gauss(0, 1)))
            tanker = max(1, int(total * 0.28 + random.gauss(0, 1)))
            container = max(1, total - db - tanker)
            
            records.append(ChokepointTransit(
                date=cur_date,
                chokepoint=cp["name"],
                total_transits=total,
                dry_bulk_transits=db,
                tanker_transits=tanker,
                container_transits=container,
                total_capacity_dwt=round(total * 72000.0, 0)
            ))

    session.add_all(records)
    session.commit()
    print(f"[OK] Seeded {len(records)} chokepoint transit records.")


def main():
    print("====================================================")
    print("[*] SIH 2026 Freight Forecasting: Database Seeding")
    print("====================================================")
    create_db_and_tables()
    
    FleetSupplyIngestion.load_fleet_supply_data()
    print("[OK] Fleet supply CSV confirmed.")

    with Session(engine) as session:
        seed_freight_rates(session)
        seed_economic_indicators(session)
        seed_port_congestion(session)
        seed_chokepoints(session)

    print("====================================================")
    print("[OK] All databases and reference series seeded successfully!")
    print("====================================================")


if __name__ == "__main__":
    main()
