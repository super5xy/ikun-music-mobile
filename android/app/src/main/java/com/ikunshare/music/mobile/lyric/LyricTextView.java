package com.ikunshare.music.mobile.lyric;

import android.annotation.SuppressLint;
import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.view.Gravity;
import android.widget.TextView;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;

// https://github.com/Block-Network/StatusBarLyric/blob/main/app/src/main/java/statusbar/lyric/view/LyricTextView.kt
@SuppressLint("AppCompatCustomView")
public class LyricTextView extends TextView {
  private static final float SPEED_LIMIT = 0.135F;
  private static final float READING_SCALE = 1.4F;
  private static final float READING_GAP = 4F;
  public static final int startScrollDelay = 1500;
  public static final int invalidateDelay = 10;

  private boolean isStop = true;
  private boolean isSingleLineMode = true;
  private boolean isShowFurigana = false;
  private int maxDisplayLines = 1;
  private float textLength = 0F;
  private float viewWidth = 0F;
  private float viewHeight = 0F;
  private float speed;
  private float xx = 0F;
  private int gravityVertical = Gravity.TOP;
  private int gravityHorizontal = Gravity.CENTER;
  private String text = "";
  private String furigana = "";
  private final Paint mPaint;
  private final Paint readingPaint;
  private final Runnable mStartScrollRunnable;
  private final Runnable invalidateRunnable;
  private final ArrayList<String> extendedLyrics = new ArrayList<>();
  private final ArrayList<FuriganaChunk> furiganaChunks = new ArrayList<>();
  private final ArrayList<ArrayList<FuriganaChunk>> wrappedFuriganaLines = new ArrayList<>();
  private final ArrayList<String> wrappedPrimaryLines = new ArrayList<>();
  private final ArrayList<String> wrappedExtendedLines = new ArrayList<>();

  private static final class FuriganaChunk {
    final String surface;
    final String reading;
    final boolean isKanaOnly;

    FuriganaChunk(String surface, String reading, boolean isKanaOnly) {
      this.surface = surface;
      this.reading = reading;
      this.isKanaOnly = isKanaOnly;
    }
  }

  public LyricTextView(Context context) {
    super(context);
    mStartScrollRunnable = LyricTextView.this::startScroll;
    invalidateRunnable = LyricTextView.this::invalidate;
    mPaint = getPaint();
    readingPaint = new Paint(mPaint);
    readingPaint.setTextSize(mPaint.getTextSize() * READING_SCALE);
    speed = SPEED_LIMIT * getTextSize();
  }

  public void setLyricData(String text, String furigana, ArrayList<String> extendedLyrics, boolean isShowFurigana) {
    stopScroll();
    this.text = text == null ? "" : text;
    this.furigana = furigana == null ? "" : furigana;
    this.isShowFurigana = isShowFurigana;
    this.extendedLyrics.clear();
    if (extendedLyrics != null) this.extendedLyrics.addAll(extendedLyrics);
    parseFurigana();
    init();
    postInvalidate();
    postDelayed(mStartScrollRunnable, startScrollDelay);
  }

  @Override
  protected void onDetachedFromWindow() {
    removeCallbacks(mStartScrollRunnable);
    removeCallbacks(invalidateRunnable);
    super.onDetachedFromWindow();
  }

  @Override
  protected void onTextChanged(CharSequence text, int start, int lengthBefore, int lengthAfter) {
    super.onTextChanged(text, start, lengthBefore, lengthAfter);
    if (mPaint == null || readingPaint == null) return;
    stopScroll();
    init();
    postInvalidate();
    postDelayed(mStartScrollRunnable, startScrollDelay);
  }

  @Override
  public void setTextColor(int color) {
    if (mPaint != null) mPaint.setColor(color);
    if (readingPaint != null) readingPaint.setColor(color);
    postInvalidate();
  }

  @Override
  public void setShadowLayer(float radius, float dx, float dy, int shadowColor) {
    if (mPaint != null) mPaint.setShadowLayer(radius, dx, dy, shadowColor);
    if (readingPaint != null) readingPaint.setShadowLayer(radius, dx, dy, shadowColor);
    post(mStartScrollRunnable);
  }

  @Override
  public void setTextSize(float size) {
    super.setTextSize(size);
    speed = SPEED_LIMIT * size;
    readingPaint.setTextSize(size * READING_SCALE);
    if (text == null) return;
    post(mStartScrollRunnable);
  }

  @Override
  public void setWidth(int pixels) {
    super.setWidth(pixels);
    viewWidth = pixels;
    if (text == null) return;
    post(mStartScrollRunnable);
  }

  @Override
  public void setHeight(int pixels) {
    super.setHeight(pixels);
    viewHeight = pixels;
    if (text == null) return;
    post(mStartScrollRunnable);
  }

  @Override
  public void setGravity(int gravity) {
    if ((gravity & Gravity.RELATIVE_HORIZONTAL_GRAVITY_MASK) == 0) {
      gravity |= Gravity.START;
    }
    if ((gravity & Gravity.VERTICAL_GRAVITY_MASK) == 0) {
      gravity |= Gravity.TOP;
    }

    gravityVertical = gravity & Gravity.VERTICAL_GRAVITY_MASK;
    gravityHorizontal = gravity & Gravity.RELATIVE_HORIZONTAL_GRAVITY_MASK;

    if (text == null) return;
    post(mStartScrollRunnable);
  }

  @Override
  public void setSingleLine(boolean singleLine) {
    super.setSingleLine(singleLine);
    isSingleLineMode = singleLine;
    if (mPaint == null || readingPaint == null) return;
    stopScroll();
    init();
    postInvalidate();
    postDelayed(mStartScrollRunnable, startScrollDelay);
  }

  @Override
  public void setMaxLines(int maxLines) {
    super.setMaxLines(maxLines);
    maxDisplayLines = Math.max(maxLines, 1);
    if (mPaint == null || readingPaint == null) return;
    stopScroll();
    init();
    postInvalidate();
    postDelayed(mStartScrollRunnable, startScrollDelay);
  }

  public int getPreferredHeight(int maxLineNum) {
    int totalLineLimit = Math.max(maxLineNum, 1);
    int extraLineCount = isSingleLineMode ? 0 : Math.min(wrappedExtendedLines.size(), Math.max(totalLineLimit - 1, 0));
    int primaryLineCount = Math.min(getPrimaryDisplayLineCount(), Math.max(totalLineLimit - extraLineCount, 1));
    int preferredHeight = (int) Math.ceil(primaryLineCount * getPrimaryLineHeight() + extraLineCount * getNormalLineHeight());
    return preferredHeight;
  }

  @Override
  protected void onDraw(Canvas canvas) {
    if (text == null || mPaint == null) return;

    float primaryLineHeight = getPrimaryLineHeight();
    int totalLineLimit = Math.max(maxDisplayLines, 1);
    int extraLineCount = isSingleLineMode ? 0 : Math.min(wrappedExtendedLines.size(), Math.max(totalLineLimit - 1, 0));
    int primaryLineCount = Math.min(getPrimaryDisplayLineCount(), Math.max(totalLineLimit - extraLineCount, 1));
    float totalHeight = primaryLineCount * primaryLineHeight + extraLineCount * getNormalLineHeight();
    float top = getContentTop(totalHeight);
    float lineTop = top;

    for (int i = 0; i < primaryLineCount; i++) {
      if (hasFurigana() && i < wrappedFuriganaLines.size() && readingPaint != null) {
        ArrayList<FuriganaChunk> lineChunks = wrappedFuriganaLines.get(i);
        drawFuriganaLine(canvas, getAlignedX(getFuriganaLineWidth(lineChunks)), lineTop, lineChunks);
      } else {
        String line = getPrimaryLine(i);
        canvas.drawText(line, getAlignedX(mPaint.measureText(line)), lineTop - mPaint.getFontMetrics().ascent, mPaint);
      }
      lineTop += primaryLineHeight;
    }

    for (int i = 0; i < extraLineCount; i++) {
      String line = wrappedExtendedLines.get(i);
      canvas.drawText(line, getAlignedX(mPaint.measureText(line)), lineTop - mPaint.getFontMetrics().ascent, mPaint);
      lineTop += getNormalLineHeight();
    }

    if (isSingleLineMode && !isStop) {
      float mSpeed = speed;
      if (text.length() >= 20) mSpeed += mSpeed;
      if (viewWidth - xx + mSpeed >= textLength) {
        xx = viewWidth - textLength - 2;
        stopScroll();
      } else {
        xx -= mSpeed;
      }
      invalidateAfter();
    }
  }

  private void init() {
    updateWrappedLines();
    xx = 0.0F;
    textLength = getTextLength();
  }

  private void invalidateAfter() {
    removeCallbacks(invalidateRunnable);
    postDelayed(invalidateRunnable, invalidateDelay);
  }

  private void startScroll() {
    init();
    isStop = !isSingleLineMode || textLength <= viewWidth;
    postInvalidate();
  }

  private void stopScroll() {
    isStop = true;
    removeCallbacks(mStartScrollRunnable);
    postInvalidate();
  }

  private void parseFurigana() {
    furiganaChunks.clear();
    if (!isShowFurigana || furigana.isEmpty()) return;
    try {
      JSONArray array = new JSONArray(furigana);
      for (int i = 0; i < array.length(); i++) {
        JSONObject item = array.optJSONObject(i);
        if (item == null) continue;
        String surface = item.optString("surface", "");
        if (surface.isEmpty()) continue;
        String reading = item.isNull("reading") ? "" : item.optString("reading", "");
        boolean isKanaOnly = item.optBoolean("isKanaOnly", false);
        furiganaChunks.add(new FuriganaChunk(surface, reading, isKanaOnly));
      }
    } catch (Exception ignored) {}
  }

  private boolean hasFurigana() {
    return isShowFurigana && !furiganaChunks.isEmpty();
  }

  private void updateWrappedLines() {
    wrappedPrimaryLines.clear();
    wrappedExtendedLines.clear();
    wrappedFuriganaLines.clear();

    if (isSingleLineMode) {
      wrappedPrimaryLines.add(text == null ? "" : text);
      if (hasFurigana()) wrappedFuriganaLines.add(new ArrayList<>(furiganaChunks));
      return;
    }

    if (hasFurigana()) {
      wrapFuriganaChunks();
      if (wrappedFuriganaLines.isEmpty()) {
        wrappedPrimaryLines.add(text == null ? "" : text);
      }
    } else {
      wrappedPrimaryLines.addAll(wrapPlainText(text));
    }

    for (String line : extendedLyrics) {
      wrappedExtendedLines.addAll(wrapPlainText(line));
    }

    if (wrappedPrimaryLines.isEmpty() && !hasFurigana()) {
      wrappedPrimaryLines.add(text == null ? "" : text);
    }
  }

  private void wrapFuriganaChunks() {
    ArrayList<FuriganaChunk> currentLine = new ArrayList<>();
    StringBuilder currentText = new StringBuilder();
    float currentWidth = 0F;
    float maxWidth = getWrapWidth();

    for (FuriganaChunk chunk : furiganaChunks) {
      float chunkWidth = getChunkWidth(chunk);
      boolean shouldWrap = !currentLine.isEmpty() && maxWidth > 0F && currentWidth + chunkWidth > maxWidth;
      if (shouldWrap) {
        wrappedFuriganaLines.add(new ArrayList<>(currentLine));
        wrappedPrimaryLines.add(currentText.toString());
        currentLine.clear();
        currentText.setLength(0);
        currentWidth = 0F;
      }
      currentLine.add(chunk);
      currentText.append(chunk.surface);
      currentWidth += chunkWidth;
    }

    if (!currentLine.isEmpty() || furiganaChunks.isEmpty()) {
      wrappedFuriganaLines.add(new ArrayList<>(currentLine));
      wrappedPrimaryLines.add(currentText.toString());
    }
  }

  private ArrayList<String> wrapPlainText(String value) {
    ArrayList<String> lines = new ArrayList<>();
    String source = value == null ? "" : value;
    if (source.isEmpty()) {
      lines.add("");
      return lines;
    }

    float maxWidth = getWrapWidth();
    if (maxWidth <= 0F) {
      lines.add(source);
      return lines;
    }

    StringBuilder currentLine = new StringBuilder();
    for (int i = 0; i < source.length(); i++) {
      String ch = source.substring(i, i + 1);
      if ("\n".equals(ch)) {
        lines.add(currentLine.toString());
        currentLine.setLength(0);
        continue;
      }
      String nextLine = currentLine + ch;
      if (currentLine.length() > 0 && mPaint.measureText(nextLine) > maxWidth) {
        lines.add(currentLine.toString());
        currentLine.setLength(0);
      }
      currentLine.append(ch);
    }

    if (currentLine.length() > 0 || lines.isEmpty()) {
      lines.add(currentLine.toString());
    }
    return lines;
  }

  private int getPrimaryDisplayLineCount() {
    if (hasFurigana()) return Math.max(wrappedFuriganaLines.size(), 1);
    return Math.max(wrappedPrimaryLines.size(), 1);
  }

  private String getPrimaryLine(int index) {
    if (wrappedPrimaryLines.isEmpty()) return text == null ? "" : text;
    if (index < 0 || index >= wrappedPrimaryLines.size()) return "";
    return wrappedPrimaryLines.get(index);
  }

  private float getWrapWidth() {
    if (viewWidth > 0F) return viewWidth;
    if (getWidth() > 0) return getWidth();
    return 0F;
  }

  private float getTextLength() {
    if (mPaint == null) return 0F;
    if (hasFurigana()) {
      if (isSingleLineMode) return getFuriganaLineWidth(furiganaChunks);
      float maxWidth = 0F;
      for (ArrayList<FuriganaChunk> line : wrappedFuriganaLines) {
        maxWidth = Math.max(maxWidth, getFuriganaLineWidth(line));
      }
      return maxWidth;
    }
    if (isSingleLineMode) return mPaint.measureText(text);
    float maxWidth = 0F;
    for (String line : wrappedPrimaryLines) {
      maxWidth = Math.max(maxWidth, mPaint.measureText(line));
    }
    return maxWidth;
  }

  private float getNormalLineHeight() {
    if (mPaint == null) return 0F;
    Paint.FontMetrics fontMetrics = mPaint.getFontMetrics();
    return fontMetrics.bottom - fontMetrics.top;
  }

  private float getPrimaryLineHeight() {
    if (mPaint == null) return 0F;
    if (!hasFurigana() || readingPaint == null) return getNormalLineHeight();
    Paint.FontMetrics mainMetrics = mPaint.getFontMetrics();
    Paint.FontMetrics readingMetrics = readingPaint.getFontMetrics();
    return (readingMetrics.bottom - readingMetrics.top) + READING_GAP + (mainMetrics.bottom - mainMetrics.top);
  }

  private float getChunkWidth(FuriganaChunk chunk) {
    if (mPaint == null) return 0F;
    float surfaceWidth = mPaint.measureText(chunk.surface);
    float readingWidth = chunk.isKanaOnly || chunk.reading.isEmpty() || readingPaint == null ? 0F : readingPaint.measureText(chunk.reading);
    return Math.max(surfaceWidth, readingWidth);
  }

  private float getFuriganaLineWidth() {
    return getFuriganaLineWidth(furiganaChunks);
  }

  private float getFuriganaLineWidth(ArrayList<FuriganaChunk> chunks) {
    if (mPaint == null) return 0F;
    float width = 0F;
    for (FuriganaChunk chunk : chunks) {
      width += getChunkWidth(chunk);
    }
    return width;
  }

  private float getAlignedX(float contentWidth) {
    if (isSingleLineMode && contentWidth >= viewWidth) return xx;
    switch (gravityHorizontal) {
      case Gravity.CENTER_HORIZONTAL:
        return (viewWidth - contentWidth) / 2F;
      case Gravity.END:
        return viewWidth - contentWidth;
      default:
        return 0F;
    }
  }

  private float getDrawX() {
    if (isSingleLineMode && textLength >= viewWidth) return xx;
    isStop = true;
    return getAlignedX(textLength);
  }

  private float getContentTop(float contentHeight) {
    switch (gravityVertical) {
      case Gravity.CENTER_VERTICAL:
        return (viewHeight - contentHeight) / 2F;
      case Gravity.BOTTOM:
        return viewHeight - contentHeight;
      default:
        return 0F;
    }
  }

  private void drawFuriganaLine(Canvas canvas, float startX, float top) {
    drawFuriganaLine(canvas, startX, top, furiganaChunks);
  }

  private void drawFuriganaLine(Canvas canvas, float startX, float top, ArrayList<FuriganaChunk> chunks) {
    if (mPaint == null || readingPaint == null) return;
    Paint.FontMetrics readingMetrics = readingPaint.getFontMetrics();
    Paint.FontMetrics mainMetrics = mPaint.getFontMetrics();
    float readingBaseline = top - readingMetrics.ascent;
    float mainTop = top + (readingMetrics.bottom - readingMetrics.top) + READING_GAP;
    float mainBaseline = mainTop - mainMetrics.ascent;
    float x = startX;

    for (FuriganaChunk chunk : chunks) {
      float surfaceWidth = mPaint.measureText(chunk.surface);
      boolean showReading = !chunk.isKanaOnly && !chunk.reading.isEmpty();
      float readingWidth = showReading ? readingPaint.measureText(chunk.reading) : 0F;
      float chunkWidth = Math.max(surfaceWidth, readingWidth);
      if (showReading) {
        canvas.drawText(chunk.reading, x + (chunkWidth - readingWidth) / 2F, readingBaseline, readingPaint);
      }
      canvas.drawText(chunk.surface, x + (chunkWidth - surfaceWidth) / 2F, mainBaseline, mPaint);
      x += chunkWidth;
    }
  }
}
