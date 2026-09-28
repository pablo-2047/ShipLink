"""Master script to compose a broadcast-grade SaaS video showcase for the
Smart India Hackathon 2026 National Round using real captured UI from
ShipLink running at http://localhost:5173.

Features:
- 1080p Full HD @ 30 FPS
- Full coverage of all 5 operational suites from top to bottom
- Smooth cosine easing camera panning across long UI pages
- Spotlight card pop-out animations with spring easing, cyan cyber glow & drop shadows
- Glassmorphic lower-third teleprompter callout cards with explanations and metrics
- Top navigation bar tracking active modules with live BDI telemetry and progress line
- Direct FFmpeg rawvideo pipe for fast, lossless encoding
"""

import os
import sys
import math
import subprocess
from PIL import Image, ImageDraw, ImageFont, ImageFilter

OUTPUT_VIDEO = "ShipLink_National_Round_Pitch_Video.mp4"
CAPTURES_DIR = "scratch/real_ui_captures"
WIDTH = 1920
HEIGHT = 1080
FPS = 30

# Colors
BG_VOID = (3, 7, 18)           # Slate 950
GLASS_BG = (9, 14, 28, 240)     # Glassmorphic dark
GLASS_BORDER = (56, 189, 248, 160) # Cyan 400 with alpha
CYAN_ACCENT = (56, 189, 248)    # #38bdf8
CYAN_GLOW = (14, 165, 233)      # #0ea5e9
EMERALD_ACCENT = (16, 185, 129) # #10b981
ROSE_ACCENT = (244, 63, 94)     # #f43f5e
AMBER_ACCENT = (245, 158, 11)   # #f59e0b
TEXT_WHITE = (255, 255, 255)
TEXT_MUTED = (203, 213, 225)    # Slate 300
TEXT_DARK_MUTED = (148, 163, 184) # Slate 400

# Load fonts
FONT_PATH_BOLD = "C:/Windows/Fonts/segoeuib.ttf"
FONT_PATH_REG = "C:/Windows/Fonts/segoeui.ttf"

try:
    font_brand = ImageFont.truetype(FONT_PATH_BOLD, 18)
    font_brand_sub = ImageFont.truetype(FONT_PATH_REG, 12)
    font_nav = ImageFont.truetype(FONT_PATH_BOLD, 13)
    font_bdi = ImageFont.truetype(FONT_PATH_BOLD, 13)
    
    font_tag = ImageFont.truetype(FONT_PATH_BOLD, 13)
    font_title = ImageFont.truetype(FONT_PATH_BOLD, 24)
    font_body = ImageFont.truetype(FONT_PATH_REG, 17)
    font_stat = ImageFont.truetype(FONT_PATH_BOLD, 20)
    font_stat_sub = ImageFont.truetype(FONT_PATH_REG, 12)
    
    font_hero_large = ImageFont.truetype(FONT_PATH_BOLD, 58)
    font_hero_mid = ImageFont.truetype(FONT_PATH_BOLD, 26)
    font_hero_body = ImageFont.truetype(FONT_PATH_REG, 18)
except Exception as e:
    print("Warning: Could not load Segoe UI font, falling back to default.", e)
    font_brand = font_nav = font_bdi = font_tag = font_title = font_body = font_stat = font_stat_sub = font_hero_large = font_hero_mid = font_hero_body = ImageFont.load_default()

# -------------------------------------------------------------
# Asset Cache
# -------------------------------------------------------------
images_cache = {}

def load_and_scale(filename, target_width=None, target_height=None):
    path = os.path.join(CAPTURES_DIR, filename)
    if not os.path.exists(path):
        print(f"Warning: File not found: {path}")
        return None
    im = Image.open(path).convert("RGBA")
    if target_width and not target_height:
        ratio = target_width / im.width
        target_height = int(im.height * ratio)
        im = im.resize((target_width, target_height), Image.Resampling.LANCZOS)
    elif target_height and not target_width:
        ratio = target_height / im.height
        target_width = int(im.width * ratio)
        im = im.resize((target_width, target_height), Image.Resampling.LANCZOS)
    elif target_width and target_height:
        im = im.resize((target_width, target_height), Image.Resampling.LANCZOS)
    return im

print("Pre-loading and scaling real UI assets...")
# Full pages scaled to width 1920
images_cache["cockpit_full"] = load_and_scale("01_cockpit_full.png", target_width=1920)
images_cache["opt_step1"] = load_and_scale("02_optimizer_step1.png", target_width=1920)
images_cache["opt_step2"] = load_and_scale("02_optimizer_step2.png", target_width=1920)
images_cache["opt_step3"] = load_and_scale("02_optimizer_step3.png", target_width=1920)
images_cache["forecaster_full"] = load_and_scale("03_forecaster_full.png", target_width=1920)
images_cache["ports_grid"] = load_and_scale("04_ports_grid.png", target_width=1920)
images_cache["ports_calc"] = load_and_scale("04_ports_calc.png", target_width=1920)
images_cache["simulator_full"] = load_and_scale("05_simulator_full.png", target_width=1920)

# Card spotlight crops (high resolution native)
images_cache["cockpit_hero"] = load_and_scale("01_cockpit_hero.png")
images_cache["cockpit_kpis"] = load_and_scale("01_cockpit_kpis.png")
images_cache["opt_hull"] = load_and_scale("02_optimizer_hull_gauge.png")
images_cache["opt_contracts"] = load_and_scale("02_optimizer_contracts.png")
images_cache["forecaster_shap"] = load_and_scale("03_forecaster_shap.png")
images_cache["forecaster_benchmarks"] = load_and_scale("03_forecaster_benchmarks_top.png")
images_cache["ports_paradip"] = load_and_scale("04_ports_paradip_card.png")
images_cache["ports_calc_body"] = load_and_scale("04_ports_calc_body.png")
images_cache["sim_crisis"] = load_and_scale("05_simulator_crisis_banner.png")
images_cache["sim_chart"] = load_and_scale("05_simulator_chart_top.png")
images_cache["sim_sop"] = load_and_scale("05_simulator_sop.png")

print("All real UI assets loaded successfully.")

# -------------------------------------------------------------
# Drawing Helpers
# -------------------------------------------------------------
MODULE_TABS = [
    ("1. FLEET COCKPIT", CYAN_ACCENT),
    ("2. CHARTER PLANNER", CYAN_ACCENT),
    ("3. FREIGHT FORECAST", CYAN_ACCENT),
    ("4. PORT RADAR", CYAN_ACCENT),
    ("5. SCENARIO LAB", ROSE_ACCENT)
]

def draw_top_nav(canvas, active_module_idx, global_progress=0.0):
    """Renders the professional top navigation bar with active tab and telemetry."""
    overlay = Image.new("RGBA", (WIDTH, 44), (9, 14, 28, 245))
    canvas.paste(overlay, (0, 0), overlay)
    draw = ImageDraw.Draw(canvas)
    
    # Left Brand
    draw.ellipse([(20, 16), (30, 26)], fill=EMERALD_ACCENT) # Live pulse dot
    draw.text((40, 12), "SHIPLINK", font=font_brand, fill=TEXT_WHITE)
    draw.text((132, 16), "AI MARITIME SUITE", font=font_brand_sub, fill=TEXT_DARK_MUTED)
    
    # Center Tabs
    tab_x = 420
    for idx, (tab_name, accent_color) in enumerate(MODULE_TABS):
        is_active = (idx == active_module_idx)
        # Bounding box for pill
        text_bbox = font_nav.getbbox(tab_name)
        pw = (text_bbox[2] - text_bbox[0]) + 24
        ph = 26
        py = 9
        
        if is_active:
            # Active pill with cyan background & glow
            draw.rounded_rectangle([(tab_x, py), (tab_x + pw, py + ph)], radius=13, fill=(2, 132, 199, 210), outline=accent_color, width=1)
            draw.ellipse([(tab_x + 9, py + 10), (tab_x + 15, py + 16)], fill=TEXT_WHITE)
            draw.text((tab_x + 20, py + 5), tab_name, font=font_nav, fill=TEXT_WHITE)
        else:
            # Inactive tab
            draw.text((tab_x + 8, py + 5), tab_name, font=font_nav, fill=TEXT_DARK_MUTED)
            
        tab_x += pw + 18
        
    # Right Live Telemetry
    draw.rounded_rectangle([(WIDTH - 320, 9), (WIDTH - 20, 35)], radius=6, fill=(15, 23, 42, 200), outline=(51, 65, 85, 200), width=1)
    draw.ellipse([(WIDTH - 308, 18), (WIDTH - 300, 26)], fill=CYAN_ACCENT)
    draw.text((WIDTH - 292, 13), "BALTIC DRY INDEX: 3,370 pts (+1.02%)", font=font_bdi, fill=CYAN_ACCENT)
    
    # Bottom Hairline & Progress Bar
    draw.line([(0, 43), (WIDTH, 43)], fill=(30, 41, 59, 255), width=1)
    prog_w = int(WIDTH * max(0.0, min(1.0, global_progress)))
    if prog_w > 0:
        draw.line([(0, 43), (prog_w, 43)], fill=CYAN_ACCENT, width=2)


def draw_spotlight_card(canvas, card_img, center_x, center_y, max_w, max_h, scale=1.0, glow_color=CYAN_ACCENT):
    """Draws a cropped card popping forward with smooth scaling, drop shadow, and cyber glow."""
    if card_img is None:
        return
    
    # Calculate scaled dimensions
    w = card_img.width
    h = card_img.height
    scale_fit = min(max_w / w, max_h / h)
    final_scale = scale_fit * scale
    
    target_w = int(w * final_scale)
    target_h = int(h * final_scale)
    
    scaled_card = card_img.resize((target_w, target_h), Image.Resampling.LANCZOS)
    
    top_left_x = int(center_x - target_w / 2)
    top_left_y = int(center_y - target_h / 2)
    
    # 1. Deep Drop Shadow
    shadow_layer = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow_layer)
    shadow_offset_y = 15
    shadow_draw.rounded_rectangle(
        [(top_left_x - 10, top_left_y + shadow_offset_y - 10), 
         (top_left_x + target_w + 10, top_left_y + target_h + shadow_offset_y + 10)],
        radius=20,
        fill=(0, 0, 0, 180)
    )
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(radius=18))
    canvas.paste(shadow_layer, (0, 0), shadow_layer)
    
    # 2. Outer Cyber Halo Glow
    glow_layer = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_layer)
    glow_draw.rounded_rectangle(
        [(top_left_x - 4, top_left_y - 4), 
         (top_left_x + target_w + 4, top_left_y + target_h + 4)],
        radius=16,
        fill=(*glow_color, 110)
    )
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(radius=10))
    canvas.paste(glow_layer, (0, 0), glow_layer)
    
    # 3. Paste the actual card
    canvas.paste(scaled_card, (top_left_x, top_left_y), scaled_card)
    
    # 4. Crisp Glowing Border Outline
    border_layer = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    b_draw = ImageDraw.Draw(border_layer)
    b_draw.rounded_rectangle(
        [(top_left_x, top_left_y), (top_left_x + target_w, top_left_y + target_h)],
        radius=14,
        outline=(*glow_color, 240),
        width=2
    )
    canvas.paste(border_layer, (0, 0), border_layer)


def draw_lower_third(canvas, tag, title, body, stat_value=None, stat_label=None, accent_color=CYAN_ACCENT, slide_progress=1.0):
    """Draws the teleprompter explanation card at the bottom of the screen with smooth slide-in."""
    card_w = 1800
    card_h = 240
    base_x = (WIDTH - card_w) // 2
    
    # Slide up from bottom
    hidden_y = HEIGHT + 20
    target_y = 790
    cur_y = int(hidden_y - (hidden_y - target_y) * slide_progress)
    
    # Glassmorphism container
    box = Image.new("RGBA", (card_w, card_h), (8, 14, 28, 242))
    box_draw = ImageDraw.Draw(box)
    
    # Glowing top accent strip
    box_draw.rectangle([(0, 0), (card_w, 4)], fill=accent_color)
    
    # Category Tag Capsule
    tag_bbox = font_tag.getbbox(tag)
    tw = (tag_bbox[2] - tag_bbox[0]) + 44
    box_draw.rounded_rectangle([(40, 24), (40 + tw, 50)], radius=13, fill=(*accent_color, 45), outline=accent_color, width=1)
    box_draw.ellipse([(48, 33), (56, 41)], fill=accent_color)
    box_draw.text((64, 28), tag, font=font_tag, fill=accent_color)
    
    # Title
    box_draw.text((40, 62), title, font=font_title, fill=TEXT_WHITE)
    
    # Multi-line Body Description
    lines = []
    words = body.split()
    cur_line = []
    # Wrap text to fit width (leaving 360px on right for stat pill if present)
    max_text_width = card_w - (420 if stat_value else 100)
    
    for word in words:
        test_line = " ".join(cur_line + [word])
        bbox = font_body.getbbox(test_line)
        if bbox[2] - bbox[0] > max_text_width:
            lines.append(" ".join(cur_line))
            cur_line = [word]
        else:
            cur_line.append(word)
    if cur_line:
        lines.append(" ".join(cur_line))
        
    line_y = 104
    for line in lines[:3]:
        box_draw.text((40, line_y), line, font=font_body, fill=TEXT_MUTED)
        line_y += 28
        
    # Right Side Stat Badge (if specified)
    if stat_value:
        pill_w = 300
        pill_h = 105
        pill_x = card_w - pill_w - 40
        pill_y = 60
        box_draw.rounded_rectangle(
            [(pill_x, pill_y), (pill_x + pill_w, pill_y + pill_h)],
            radius=12,
            fill=(15, 23, 42, 220),
            outline=(*accent_color, 160),
            width=2
        )
        # Inner stat text
        s_bbox = font_stat.getbbox(stat_value)
        sw = s_bbox[2] - s_bbox[0]
        box_draw.text((pill_x + (pill_w - sw) // 2, pill_y + 24), stat_value, font=font_stat, fill=accent_color)
        if stat_label:
            l_bbox = font_stat_sub.getbbox(stat_label)
            lw = l_bbox[2] - l_bbox[0]
            box_draw.text((pill_x + (pill_w - lw) // 2, pill_y + 60), stat_label, font=font_stat_sub, fill=TEXT_DARK_MUTED)
            
    # Border stroke
    box_draw.rounded_rectangle([(0, 0), (card_w - 1, card_h - 1)], radius=16, outline=GLASS_BORDER, width=1)
    
    # Paste to canvas
    canvas.paste(box, (base_x, cur_y), box)


def render_background_scroll(canvas, full_img, scroll_y):
    """Draws a vertical window slice of a full-page capture."""
    if full_img is None:
        canvas.paste(Image.new("RGB", (WIDTH, HEIGHT), BG_VOID), (0, 0))
        return
    
    h_available = HEIGHT - 44
    max_scroll = max(0, full_img.height - h_available)
    actual_scroll = int(max(0, min(max_scroll, scroll_y)))
    
    crop_box = (0, actual_scroll, WIDTH, actual_scroll + h_available)
    slice_img = full_img.crop(crop_box)
    canvas.paste(slice_img, (0, 44))


def apply_dim_overlay(canvas, alpha=175):
    """Applies a darkening overlay over the scrolling UI to focus on spotlighted cards."""
    dim = Image.new("RGBA", (WIDTH, HEIGHT - 44), (3, 7, 18, alpha))
    canvas.paste(dim, (0, 44), dim)


def smooth_cosine(t):
    """Standard smooth cosine ease-in-out from 0.0 to 1.0."""
    t = max(0.0, min(1.0, t))
    return 0.5 - 0.5 * math.cos(math.pi * t)


def spring_scale(t):
    """Elastic spring scale for popping cards in (0.92 -> 1.04 -> 1.00)."""
    t = max(0.0, min(1.0, t))
    if t < 0.6:
        # Accelerate up to 1.04
        return 0.92 + (1.04 - 0.92) * (t / 0.6)
    else:
        # Settle back to 1.00
        t2 = (t - 0.6) / 0.4
        return 1.04 - 0.04 * math.sin(t2 * math.pi / 2)

# -------------------------------------------------------------
# Master Frame Generator
# -------------------------------------------------------------
TOTAL_FRAMES = 2670 # ~89 seconds @ 30 FPS

def generate_frame(f):
    canvas = Image.new("RGBA", (WIDTH, HEIGHT), (*BG_VOID, 255))
    global_progress = f / TOTAL_FRAMES
    
    # =========================================================
    # SCENE 0: INTRO TITLE SEQUENCE (Frames 0 to 120 / 4.0s)
    # =========================================================
    if f < 120:
        t = f / 120.0
        draw = ImageDraw.Draw(canvas)
        
        # Cyber grid lines with moving sweep
        for gx in range(0, WIDTH, 80):
            draw.line([(gx, 0), (gx, HEIGHT)], fill=(15, 23, 42, 100), width=1)
        for gy in range(0, HEIGHT, 80):
            draw.line([(0, gy), (WIDTH, gy)], fill=(15, 23, 42, 100), width=1)
            
        # Glowing Radar Rings
        ring_r = int(180 + 140 * math.sin(t * math.pi))
        draw.ellipse([(WIDTH//2 - ring_r, HEIGHT//2 - ring_r), (WIDTH//2 + ring_r, HEIGHT//2 + ring_r)], outline=(56, 189, 248, 40), width=2)
        draw.ellipse([(WIDTH//2 - ring_r//2, HEIGHT//2 - ring_r//2), (WIDTH//2 + ring_r//2, HEIGHT//2 + ring_r//2)], outline=(14, 165, 233, 60), width=1)
        
        # Main Title Glow & Text
        title_text = "SHIPLINK"
        t_bbox = font_hero_large.getbbox(title_text)
        tw = t_bbox[2] - t_bbox[0]
        draw.text(((WIDTH - tw)//2, HEIGHT//2 - 160), title_text, font=font_hero_large, fill=TEXT_WHITE)
        
        # Subtitle
        sub_text = "Autonomous AI Maritime Freight Intelligence Suite"
        s_bbox = font_hero_mid.getbbox(sub_text)
        sw = s_bbox[2] - s_bbox[0]
        draw.text(((WIDTH - sw)//2, HEIGHT//2 - 75), sub_text, font=font_hero_mid, fill=CYAN_ACCENT)
        
        # Hackathon badge
        sih_text = "SMART INDIA HACKATHON 2026 · NATIONAL FINALE PITCH SHOWCASE"
        h_bbox = font_tag.getbbox(sih_text)
        hw = h_bbox[2] - h_bbox[0]
        draw.rounded_rectangle([((WIDTH - hw)//2 - 20, HEIGHT//2 - 20), ((WIDTH + hw)//2 + 20, HEIGHT//2 + 15)], radius=12, fill=(2, 132, 199, 40), outline=CYAN_ACCENT, width=2)
        draw.text(((WIDTH - hw)//2, HEIGHT//2 - 12), sih_text, font=font_tag, fill=CYAN_ACCENT)
        
        # 4 Core Capability Badges
        caps = [
            "BALTIC DRY INDEX LIVE FEED",
            "PHYSICS NAVAL HYDRODYNAMICS",
            "EXPLAINABLE AI (TreeSHAP)",
            "8 COASTAL BULK TERMINALS"
        ]
        badge_x = (WIDTH - 1100) // 2
        for cap in caps:
            cb = font_bdi.getbbox(cap)
            cw = cb[2] - cb[0] + 20
            draw.rounded_rectangle([(badge_x, HEIGHT//2 + 65), (badge_x + cw, HEIGHT//2 + 95)], radius=6, fill=(15, 23, 42, 220), outline=(51, 65, 85, 200), width=1)
            draw.text((badge_x + 10, HEIGHT//2 + 72), cap, font=font_bdi, fill=TEXT_MUTED)
            badge_x += cw + 15
            
        draw_top_nav(canvas, active_module_idx=0, global_progress=global_progress)
        return canvas.convert("RGB")

    # =========================================================
    # SCENE 1: FLEET COCKPIT & COMMERCIAL INTELLIGENCE (Frames 120 to 570 / 15.0s)
    # =========================================================
    elif f < 570:
        sf = f - 120 # 0 to 450
        active_tab = 0
        
        # Pan down cockpit full page
        if sf < 60:
            # 120-180: Initial view at top, starting to glide
            scroll_y = 0
            render_background_scroll(canvas, images_cache["cockpit_full"], scroll_y)
            draw_top_nav(canvas, active_tab, global_progress)
            
        elif sf < 240:
            # 180-360: Spotlight 1A - Hero Fixture Recommendation
            scroll_y = 200
            render_background_scroll(canvas, images_cache["cockpit_full"], scroll_y)
            apply_dim_overlay(canvas, alpha=175)
            
            # Animate Card Pop
            anim_t = min(1.0, (sf - 60) / 15.0)
            scale = spring_scale(anim_t)
            slide_t = smooth_cosine(anim_t)
            
            draw_spotlight_card(canvas, images_cache["cockpit_hero"], center_x=WIDTH//2, center_y=420, max_w=1520, max_h=380, scale=scale, glow_color=CYAN_ACCENT)
            
            draw_lower_third(
                canvas,
                tag="MODULE 01 · COMMERCIAL FIXTURE AI",
                title="Recommended Fixture: 3-Month Time Charter at ₹16,33,374/day",
                body="Synthesizes real-time Baltic Dry Index momentum with hydrodynamic consumption to lock in charter contracts, hedging against multi-crore spot exposure for 65,000 DWT Ultramax bulkers.",
                stat_value="₹1,56,80,394",
                stat_label="Expected Contract Savings",
                accent_color=CYAN_ACCENT,
                slide_progress=slide_t
            )
            draw_top_nav(canvas, active_tab, global_progress)
            
        elif sf < 300:
            # 360-420: Pan down to 4 KPI Metrics
            pan_t = smooth_cosine((sf - 240) / 60.0)
            scroll_y = int(200 + 450 * pan_t)
            render_background_scroll(canvas, images_cache["cockpit_full"], scroll_y)
            draw_top_nav(canvas, active_tab, global_progress)
            
        else:
            # 420-570: Spotlight 1B - 4 Key Performance Metrics
            scroll_y = 650
            render_background_scroll(canvas, images_cache["cockpit_full"], scroll_y)
            apply_dim_overlay(canvas, alpha=175)
            
            anim_t = min(1.0, (sf - 300) / 15.0)
            scale = spring_scale(anim_t)
            slide_t = smooth_cosine(anim_t)
            
            draw_spotlight_card(canvas, images_cache["cockpit_kpis"], center_x=WIDTH//2, center_y=430, max_w=1520, max_h=280, scale=scale, glow_color=CYAN_ACCENT)
            
            draw_lower_third(
                canvas,
                tag="MODULE 01 · FLEET TELEMETRY",
                title="Real-Time Commercial Metrics & Port Hazard Ticker",
                body="Continuous tracking of Average Spot Rates (₹16.5L/day), 94.2% AI Model Confidence, +18.4% Fleet Fuel Efficiency, and active Paradip port congestion hazard flags.",
                stat_value="94.2% Confidence",
                stat_label="Ensemble Model Accuracy",
                accent_color=CYAN_ACCENT,
                slide_progress=slide_t
            )
            draw_top_nav(canvas, active_tab, global_progress)
            
        return canvas.convert("RGB")

    # =========================================================
    # SCENE 2: CHARTER PLANNER & VESSEL HYDRODYNAMICS (Frames 570 to 1050 / 16.0s)
    # =========================================================
    elif f < 1050:
        sf = f - 570 # 0 to 480
        active_tab = 1
        
        if sf < 90:
            # 570-660: Step 1 Cargo inputs
            render_background_scroll(canvas, images_cache["opt_step1"], scroll_y=0)
            slide_t = smooth_cosine(min(1.0, sf / 15.0))
            draw_lower_third(
                canvas,
                tag="MODULE 02 · STEP 1: CARGO & ROUTE CONFIGURATION",
                title="Configurable Vessel Specifications & Fuel Grade Profiles",
                body="Supports Ultramax, Capesize, Panamax, and Supramax vessels with custom deadweight tonnage, fuel grade selection (VLSFO / MGO), sea margin buffer, and origin/discharge ports.",
                stat_value="Ultramax 65k",
                stat_label="Active Vessel Class",
                accent_color=CYAN_ACCENT,
                slide_progress=slide_t
            )
            draw_top_nav(canvas, active_tab, global_progress)
            
        elif sf < 150:
            # 660-720: Transition to Step 2 Feasibility
            pan_t = smooth_cosine((sf - 90) / 60.0)
            render_background_scroll(canvas, images_cache["opt_step2"], scroll_y=int(pan_t * 150))
            draw_top_nav(canvas, active_tab, global_progress)
            
        elif sf < 330:
            # 720-900: Spotlight 2A - Hydrodynamic Hull & Berth Draft Gauge
            render_background_scroll(canvas, images_cache["opt_step2"], scroll_y=220)
            apply_dim_overlay(canvas, alpha=175)
            
            anim_t = min(1.0, (sf - 150) / 15.0)
            scale = spring_scale(anim_t)
            slide_t = smooth_cosine(anim_t)
            
            draw_spotlight_card(canvas, images_cache["opt_hull"], center_x=WIDTH//2, center_y=410, max_w=1480, max_h=440, scale=scale, glow_color=CYAN_ACCENT)
            
            draw_lower_third(
                canvas,
                tag="MODULE 02 · STEP 2: NAVAL HYDRODYNAMICS",
                title="Hydrodynamic Hull Gauge & Dynamic Berth Draft Clearance",
                body="Physics engine calculates laden draft (13.30m) against destination berth limits (14.50m) with 1.85m Under-Keel Clearance (UKC SAFE), trim stability, and hydrodynamic drag fuel penalties.",
                stat_value="1.85m UKC SAFE",
                stat_label="Navigational Clearance",
                accent_color=EMERALD_ACCENT,
                slide_progress=slide_t
            )
            draw_top_nav(canvas, active_tab, global_progress)
            
        else:
            # 900-1050: Spotlight 2B - 4-Contract Financial Comparison Table
            render_background_scroll(canvas, images_cache["opt_step3"], scroll_y=120)
            apply_dim_overlay(canvas, alpha=175)
            
            anim_t = min(1.0, (sf - 330) / 15.0)
            scale = spring_scale(anim_t)
            slide_t = smooth_cosine(anim_t)
            
            draw_spotlight_card(canvas, images_cache["opt_contracts"], center_x=WIDTH//2, center_y=420, max_w=1480, max_h=480, scale=scale, glow_color=CYAN_ACCENT)
            
            draw_lower_third(
                canvas,
                tag="MODULE 02 · STEP 3: CONTRACT MATRIX",
                title="Multi-Contract Valuation Matrix & Demurrage Buffer",
                body="Directly benchmarks Spot Voyage vs 3-Mo TC vs 6-Mo TC vs Index-Linked charters, automatically computing Net TCE voyage revenue and demurrage break-evens to safeguard capital.",
                stat_value="Optimal: 3-Mo TC",
                stat_label="Algorithm Fixture Pick",
                accent_color=CYAN_ACCENT,
                slide_progress=slide_t
            )
            draw_top_nav(canvas, active_tab, global_progress)
            
        return canvas.convert("RGB")

    # =========================================================
    # SCENE 3: FREIGHT FORECASTER & EXPLAINABLE ML (Frames 1050 to 1530 / 16.0s)
    # =========================================================
    elif f < 1530:
        sf = f - 1050 # 0 to 480
        active_tab = 2
        
        if sf < 90:
            # 1050-1140: Glide down through Model Architecture
            pan_t = smooth_cosine(sf / 90.0)
            scroll_y = int(350 * pan_t)
            render_background_scroll(canvas, images_cache["forecaster_full"], scroll_y)
            slide_t = smooth_cosine(min(1.0, sf / 15.0))
            draw_lower_third(
                canvas,
                tag="MODULE 03 · HYBRID AI ARCHITECTURE",
                title="Physics-Informed Hybrid Machine Learning Pipeline",
                body="Combines ARIMA time-series momentum with LightGBM gradient boosting and Quantile P10-P90 prediction intervals for zero-hallucination maritime freight rate forecasting.",
                stat_value="Ensemble ML",
                stat_label="ARIMA + LightGBM + Quantiles",
                accent_color=CYAN_ACCENT,
                slide_progress=slide_t
            )
            draw_top_nav(canvas, active_tab, global_progress)
            
        elif sf < 270:
            # 1140-1320: Spotlight 3A - TreeSHAP Feature Attribution Waterfall
            scroll_y = 700
            render_background_scroll(canvas, images_cache["forecaster_full"], scroll_y)
            apply_dim_overlay(canvas, alpha=175)
            
            anim_t = min(1.0, (sf - 90) / 15.0)
            scale = spring_scale(anim_t)
            slide_t = smooth_cosine(anim_t)
            
            draw_spotlight_card(canvas, images_cache["forecaster_shap"], center_x=WIDTH//2, center_y=420, max_w=1280, max_h=580, scale=scale, glow_color=CYAN_ACCENT)
            
            draw_lower_third(
                canvas,
                tag="MODULE 03 · EXPLAINABLE AI (TreeSHAP)",
                title="Transparent Causal Attribution with TreeSHAP Explainer",
                body="Eliminates black-box AI by revealing exact causal drivers behind predictions: Brent Crude (+32%), Chinese Steel PMI (+28%), Iron Ore Fixtures (+21%), and Port Queues (+19%).",
                stat_value="TreeSHAP",
                stat_label="Explainable Global Attribution",
                accent_color=CYAN_ACCENT,
                slide_progress=slide_t
            )
            draw_top_nav(canvas, active_tab, global_progress)
            
        elif sf < 330:
            # 1320-1380: Glide down to Model Benchmarks
            pan_t = smooth_cosine((sf - 270) / 60.0)
            scroll_y = int(700 + 700 * pan_t)
            render_background_scroll(canvas, images_cache["forecaster_full"], scroll_y)
            draw_top_nav(canvas, active_tab, global_progress)
            
        else:
            # 1380-1530: Spotlight 3B - Out-of-Sample Empirical Benchmarks
            scroll_y = 1500
            render_background_scroll(canvas, images_cache["forecaster_full"], scroll_y)
            apply_dim_overlay(canvas, alpha=175)
            
            anim_t = min(1.0, (sf - 330) / 15.0)
            scale = spring_scale(anim_t)
            slide_t = smooth_cosine(anim_t)
            
            draw_spotlight_card(canvas, images_cache["forecaster_benchmarks"], center_x=WIDTH//2, center_y=420, max_w=1280, max_h=540, scale=scale, glow_color=CYAN_ACCENT)
            
            draw_lower_third(
                canvas,
                tag="MODULE 03 · MODEL BENCHMARKS",
                title="Rigorous Out-of-Sample Empirical Validation",
                body="Achieves an industry-leading 3.42% Mean Absolute Percentage Error (MAPE), 89.6% Directional Accuracy, and 0.941 R² across 10-year historical maritime cycles.",
                stat_value="3.42% MAPE",
                stat_label="Out-of-Sample Accuracy",
                accent_color=EMERALD_ACCENT,
                slide_progress=slide_t
            )
            draw_top_nav(canvas, active_tab, global_progress)
            
        return canvas.convert("RGB")

    # =========================================================
    # SCENE 4: PORT CONGESTION & COASTAL RADAR (Frames 1530 to 2010 / 16.0s)
    # =========================================================
    elif f < 2010:
        sf = f - 1530 # 0 to 480
        active_tab = 3
        
        if sf < 90:
            # 1530-1620: Overview of 8 Coastal Ports Grid
            render_background_scroll(canvas, images_cache["ports_grid"], scroll_y=0)
            slide_t = smooth_cosine(min(1.0, sf / 15.0))
            draw_lower_third(
                canvas,
                tag="MODULE 04 · COASTAL RADAR",
                title="8-Port Real-Time East & West Coast Congestion Grid",
                body="Monitors Paradip, Visakhapatnam, Haldia, Chennai, Mumbai, JNPT, Deendayal, and Tuticorin with real-time vessel queue telemetry, coastal weather, and draft constraints.",
                stat_value="37 Vessels",
                stat_label="Total Waiting Across Coast",
                accent_color=CYAN_ACCENT,
                slide_progress=slide_t
            )
            draw_top_nav(canvas, active_tab, global_progress)
            
        elif sf < 270:
            # 1620-1800: Spotlight 4A - Paradip Port Deep Telemetry Card
            render_background_scroll(canvas, images_cache["ports_grid"], scroll_y=180)
            apply_dim_overlay(canvas, alpha=175)
            
            anim_t = min(1.0, (sf - 90) / 15.0)
            scale = spring_scale(anim_t)
            slide_t = smooth_cosine(anim_t)
            
            draw_spotlight_card(canvas, images_cache["ports_paradip"], center_x=WIDTH//2, center_y=420, max_w=1120, max_h=580, scale=scale, glow_color=AMBER_ACCENT)
            
            draw_lower_third(
                canvas,
                tag="MODULE 04 · TERMINAL TELEMETRY",
                title="Terminal-Level Queue, Swell & Demurrage Hazard",
                body="Tracks outer channel depth (18.7m), night pilotage limits, 7 waiting bulkers, and ₹48.4 Lakhs in pending demurrage risk with live monsoon wave alerts.",
                stat_value="₹48.4 Lakhs",
                stat_label="Paradip Demurrage Risk",
                accent_color=AMBER_ACCENT,
                slide_progress=slide_t
            )
            draw_top_nav(canvas, active_tab, global_progress)
            
        else:
            # 1800-2010: Spotlight 4B - Proactive Port-Swap & Demurrage Calculator
            render_background_scroll(canvas, images_cache["ports_calc"], scroll_y=120)
            apply_dim_overlay(canvas, alpha=175)
            
            anim_t = min(1.0, (sf - 270) / 15.0)
            scale = spring_scale(anim_t)
            slide_t = smooth_cosine(anim_t)
            
            draw_spotlight_card(canvas, images_cache["ports_calc_body"], center_x=WIDTH//2, center_y=420, max_w=1480, max_h=560, scale=scale, glow_color=EMERALD_ACCENT)
            
            draw_lower_third(
                canvas,
                tag="MODULE 04 · PORT-SWAP ENGINE",
                title="Landed Cost Optimizer & Proactive Port Diversion",
                body="Simulates dynamic diversion economics: swapping from congested Paradip to Vizag Outer saves 3.2 waiting days and ₹18.5 Lakhs in demurrage penalties.",
                stat_value="-₹18.5 Lakhs",
                stat_label="Net Diversion Gain",
                accent_color=EMERALD_ACCENT,
                slide_progress=slide_t
            )
            draw_top_nav(canvas, active_tab, global_progress)
            
        return canvas.convert("RGB")

    # =========================================================
    # SCENE 5: SCENARIO LAB & GEOPOLITICAL STRESS-TESTING (Frames 2010 to 2520 / 17.0s)
    # =========================================================
    elif f < 2520:
        sf = f - 2010 # 0 to 510
        active_tab = 4
        
        if sf < 150:
            # 2010-2160: Spotlight 5A - Red Sea Crisis Shock Banner & Sliders
            render_background_scroll(canvas, images_cache["simulator_full"], scroll_y=60)
            apply_dim_overlay(canvas, alpha=175)
            
            anim_t = min(1.0, sf / 15.0)
            scale = spring_scale(anim_t)
            slide_t = smooth_cosine(anim_t)
            
            draw_spotlight_card(canvas, images_cache["sim_crisis"], center_x=WIDTH//2, center_y=380, max_w=1520, max_h=280, scale=scale, glow_color=ROSE_ACCENT)
            
            draw_lower_third(
                canvas,
                tag="MODULE 05 · GEOPOLITICAL STRESS LAB",
                title="Real-Time Geopolitical Crisis & Fuel Shock Trigger",
                body="Simulates instant Red Sea Houthi conflict disruptions: +12 days transit via Cape of Good Hope, +$450/MT bunker spike, and canal tariff escalations.",
                stat_value="CRISIS ACTIVE",
                stat_label="Red Sea / Cape Diversion",
                accent_color=ROSE_ACCENT,
                slide_progress=slide_t
            )
            draw_top_nav(canvas, active_tab, global_progress)
            
        elif sf < 330:
            # 2160-2340: Spotlight 5B - 30-Day Dynamic Escalation Curve (+₹2.39 Cr)
            render_background_scroll(canvas, images_cache["simulator_full"], scroll_y=480)
            apply_dim_overlay(canvas, alpha=175)
            
            anim_t = min(1.0, (sf - 150) / 15.0)
            scale = spring_scale(anim_t)
            slide_t = smooth_cosine(anim_t)
            
            draw_spotlight_card(canvas, images_cache["sim_chart"], center_x=WIDTH//2, center_y=420, max_w=1100, max_h=560, scale=scale, glow_color=ROSE_ACCENT)
            
            draw_lower_third(
                canvas,
                tag="MODULE 05 · CRASH SIMULATION",
                title="30-Day Financial Escalation Shock Trajectory",
                body="Instantaneous Monte Carlo recalculation plots a dynamic crimson curve showing +₹2,39,15,400 financial escalation shock above calm baseline projections.",
                stat_value="+₹2,39,15,400",
                stat_label="Total Voyage Shock Exposure",
                accent_color=ROSE_ACCENT,
                slide_progress=slide_t
            )
            draw_top_nav(canvas, active_tab, global_progress)
            
        else:
            # 2340-2520: Spotlight 5C - Automated Contingency SOP Playbook
            render_background_scroll(canvas, images_cache["simulator_full"], scroll_y=950)
            apply_dim_overlay(canvas, alpha=175)
            
            anim_t = min(1.0, (sf - 330) / 15.0)
            scale = spring_scale(anim_t)
            slide_t = smooth_cosine(anim_t)
            
            draw_spotlight_card(canvas, images_cache["sim_sop"], center_x=WIDTH//2, center_y=420, max_w=1480, max_h=400, scale=scale, glow_color=CYAN_ACCENT)
            
            draw_lower_third(
                canvas,
                tag="MODULE 05 · CONTINGENCY SOP",
                title="Automated Actionable Contingency Playbook",
                body="Generates executable operational SOPs: rerouting 3 bulkers via Cape of Good Hope, pre-booking bunker locks at Durban, and exercising force majeure clauses.",
                stat_value="SOP Ready",
                stat_label="Automated Action Plan",
                accent_color=EMERALD_ACCENT,
                slide_progress=slide_t
            )
            draw_top_nav(canvas, active_tab, global_progress)
            
        return canvas.convert("RGB")

    # =========================================================
    # SCENE 6: OUTRO & NATIONAL IMPACT (Frames 2520 to 2670 / 5.0s)
    # =========================================================
    else:
        of = f - 2520 # 0 to 150
        ot = min(1.0, of / 45.0)
        draw = ImageDraw.Draw(canvas)
        
        # Cyber grid
        for gx in range(0, WIDTH, 80):
            draw.line([(gx, 0), (gx, HEIGHT)], fill=(15, 23, 42, 100), width=1)
        for gy in range(0, HEIGHT, 80):
            draw.line([(0, gy), (WIDTH, gy)], fill=(15, 23, 42, 100), width=1)
            
        # Glowing Rings
        ring_r = int(240 + 10 * math.sin(of * 0.1))
        draw.ellipse([(WIDTH//2 - ring_r, HEIGHT//2 - ring_r), (WIDTH//2 + ring_r, HEIGHT//2 + ring_r)], outline=(56, 189, 248, 50), width=2)
        
        # Outro Title
        draw.text(((WIDTH - 300)//2, HEIGHT//2 - 200), "SHIPLINK", font=font_hero_large, fill=TEXT_WHITE)
        draw.text(((WIDTH - 640)//2, HEIGHT//2 - 120), "Maritime Decision Intelligence for India's Blue Economy", font=font_hero_mid, fill=CYAN_ACCENT)
        
        # 3 Core National Impacts
        impacts = [
            ("SAGARMALA 2030", "Aligned with National Maritime Development Vision", CYAN_ACCENT),
            ("₹45+ CRORE SAVINGS", "Annual Demurrage & Bunker Waste Mitigation", EMERALD_ACCENT),
            ("EXPLAINABLE AI", "Zero-Hallucination Naval Hydrodynamics & TreeSHAP", CYAN_ACCENT)
        ]
        
        ix = (WIDTH - 1200) // 2
        for title, desc, col in impacts:
            draw.rounded_rectangle([(ix, HEIGHT//2 - 20), (ix + 380, HEIGHT//2 + 100)], radius=14, fill=(15, 23, 42, 220), outline=(*col, 160), width=2)
            draw.text((ix + 30, HEIGHT//2), title, font=font_stat, fill=col)
            draw.text((ix + 30, HEIGHT//2 + 45), desc, font=font_brand_sub, fill=TEXT_MUTED)
            ix += 410
            
        # Hackathon Footer
        sih_footer = "ENGINEERED FOR SMART INDIA HACKATHON 2026 · NATIONAL FINALE"
        fb = font_tag.getbbox(sih_footer)
        fw = fb[2] - fb[0]
        draw.text(((WIDTH - fw)//2, HEIGHT//2 + 150), sih_footer, font=font_tag, fill=TEXT_DARK_MUTED)
        
        draw_top_nav(canvas, active_module_idx=4, global_progress=global_progress)
        return canvas.convert("RGB")


# -------------------------------------------------------------
# Main Compositor Execution
# -------------------------------------------------------------
def main():
    print(f"\n=== LAUNCHING SAAS VIDEO COMPOSITOR ===")
    print(f"Target Output: {OUTPUT_VIDEO}")
    print(f"Canvas: {WIDTH}x{HEIGHT} @ {FPS} FPS")
    print(f"Total Frames: {TOTAL_FRAMES} (~{TOTAL_FRAMES/FPS:.1f} seconds)\n")
    
    cmd = [
        "ffmpeg", "-y",
        "-f", "rawvideo",
        "-vcodec", "rawvideo",
        "-s", f"{WIDTH}x{HEIGHT}",
        "-pix_fmt", "rgb24",
        "-r", str(FPS),
        "-i", "-",
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "18",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        OUTPUT_VIDEO
    ]
    
    print("Starting FFmpeg subprocess...")
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)
    
    try:
        for f in range(TOTAL_FRAMES):
            frame_img = generate_frame(f)
            proc.stdin.write(frame_img.tobytes())
            
            if f % 150 == 0 or f == TOTAL_FRAMES - 1:
                pct = (f / TOTAL_FRAMES) * 100
                sec = f / FPS
                print(f"  Frame {f:4d}/{TOTAL_FRAMES} ({pct:5.1f}%) — {sec:4.1f}s composed...")
                sys.stdout.flush()
                
    except Exception as e:
        print(f"\nError during rendering: {e}")
        proc.kill()
        sys.exit(1)
        
    proc.stdin.close()
    proc.wait()
    
    if proc.returncode == 0 and os.path.exists(OUTPUT_VIDEO):
        size_mb = os.path.getsize(OUTPUT_VIDEO) / (1024 * 1024)
        print(f"\n========================================================")
        print(f"SUCCESS! Broadcast video composed successfully!")
        print(f"File: {OUTPUT_VIDEO}")
        print(f"Size: {size_mb:.2f} MB")
        print(f"Duration: {TOTAL_FRAMES/FPS:.1f} seconds")
        print(f"Resolution: {WIDTH}x{HEIGHT} (1080p Full HD @ 30 FPS)")
        print(f"========================================================\n")
    else:
        print(f"Error: FFmpeg exited with code {proc.returncode}")
        sys.exit(1)

if __name__ == "__main__":
    main()
