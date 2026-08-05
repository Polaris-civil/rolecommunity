package com.rolecommunity.app;

import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.database.Cursor;
import android.net.Uri;
import android.os.Environment;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "SelfHostedUpdater")
public class SelfHostedUpdaterPlugin extends Plugin {

    private DownloadManager downloadManager;
    private BroadcastReceiver downloadReceiver;

    @Override
    public void load() {
        downloadManager = (DownloadManager) getContext().getSystemService(Context.DOWNLOAD_SERVICE);
        downloadReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                long downloadId = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1);
                if (downloadId < 0 || downloadManager == null) return;
                Uri apkUri = downloadManager.getUriForDownloadedFile(downloadId);
                if (apkUri == null) return;
                Intent installIntent = new Intent(Intent.ACTION_VIEW);
                installIntent.setDataAndType(apkUri, "application/vnd.android.package-archive");
                installIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_GRANT_READ_URI_PERMISSION);
                getActivity().startActivity(installIntent);
            }
        };
        ContextCompat.registerReceiver(
            getContext(),
            downloadReceiver,
            new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE),
            ContextCompat.RECEIVER_NOT_EXPORTED
        );
    }

    @PluginMethod
    public void downloadAndInstall(PluginCall call) {
        String url = call.getString("url");
        String fileName = call.getString("fileName", "RoleCommunity-update.apk");
        if (url == null || url.trim().isEmpty()) {
            call.reject("APK URL is required");
            return;
        }
        Uri uri = Uri.parse(url);
        if (!"https".equalsIgnoreCase(uri.getScheme()) && !"http".equalsIgnoreCase(uri.getScheme())) {
            call.reject("Only HTTP(S) APK URLs are supported");
            return;
        }
        if (downloadManager == null) {
            call.reject("Android download service is unavailable");
            return;
        }
        try {
            DownloadManager.Request request = new DownloadManager.Request(uri);
            request.setTitle("RoleCommunity 更新");
            request.setDescription("下载完成后将打开系统安装确认");
            request.setMimeType("application/vnd.android.package-archive");
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            request.setAllowedOverMetered(true);
            request.setAllowedOverRoaming(true);
            request.setDestinationInExternalFilesDir(getContext(), Environment.DIRECTORY_DOWNLOADS, fileName);
            long downloadId = downloadManager.enqueue(request);
            JSObject result = new JSObject();
            result.put("downloadId", downloadId);
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Unable to start APK download", error);
        }
    }

    @PluginMethod
    public void getDownloadProgress(PluginCall call) {
        Long requestedId = call.getLong("downloadId");
        if (requestedId == null || requestedId < 0 || downloadManager == null) {
            call.reject("Download task is unavailable");
            return;
        }
        Cursor cursor = null;
        try {
            cursor = downloadManager.query(new DownloadManager.Query().setFilterById(requestedId));
            if (cursor == null || !cursor.moveToFirst()) {
                call.resolve(new JSObject().put("status", "unknown").put("progress", 0));
                return;
            }
            int status = cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS));
            long downloaded = cursor.getLong(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR));
            long total = cursor.getLong(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_TOTAL_SIZE_BYTES));
            int progress = total > 0 ? (int) Math.min(100, Math.round(downloaded * 100f / total)) : 0;
            String state = "pending";
            if (status == DownloadManager.STATUS_RUNNING) state = "downloading";
            else if (status == DownloadManager.STATUS_SUCCESSFUL) state = "complete";
            else if (status == DownloadManager.STATUS_FAILED) state = "failed";
            JSObject result = new JSObject();
            result.put("status", state);
            result.put("progress", progress);
            result.put("downloadedBytes", downloaded);
            result.put("totalBytes", total);
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Unable to read download progress", error);
        } finally {
            if (cursor != null) cursor.close();
        }
    }

    @Override
    protected void handleOnDestroy() {
        if (downloadReceiver != null) {
            try {
                getContext().unregisterReceiver(downloadReceiver);
            } catch (IllegalArgumentException ignored) {
                // Receiver was already removed by the Android lifecycle.
            }
        }
        super.handleOnDestroy();
    }
}
