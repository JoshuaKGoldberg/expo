package expo.modules.permissions.requesters

import android.os.Bundle
import org.unimodules.interfaces.permissions.PermissionsResponse
import org.unimodules.interfaces.permissions.PermissionsResponse.Companion.EXPIRES_KEY
import org.unimodules.interfaces.permissions.PermissionsResponse.Companion.CAN_ASK_AGAIN_KEY
import org.unimodules.interfaces.permissions.PermissionsResponse.Companion.PERMISSION_EXPIRES_NEVER
import org.unimodules.interfaces.permissions.PermissionsResponse.Companion.STATUS_KEY
import org.unimodules.interfaces.permissions.PermissionsStatus

/**
 * Used for representing CAMERA, CONTACTS, AUDIO_RECORDING, SMS
 */
class SimpleRequester(vararg val permission: String) : PermissionRequester {
  override fun getAndroidPermissions(): List<String> = permission.toList()

  override fun parseAndroidPermissions(permissionsResponse: Map<String, PermissionsResponse>): Bundle {
    return Bundle().apply {
      // combined status is equal:
      // granted when all needed permissions have been granted
      // denied when all needed permissions have been denied
      // undetermined if exist permission with undetermined status
      putString(STATUS_KEY, when {
        getAndroidPermissions().all { permissionsResponse.getValue(it).status == PermissionsStatus.GRANTED } -> PermissionsStatus.GRANTED.status
        getAndroidPermissions().all { permissionsResponse.getValue(it).status == PermissionsStatus.DENIED } -> PermissionsStatus.DENIED.status
        else -> PermissionsStatus.UNDETERMINED.status
      })
      putString(EXPIRES_KEY, PERMISSION_EXPIRES_NEVER)
      putBoolean(CAN_ASK_AGAIN_KEY, getAndroidPermissions().all { permissionsResponse.getValue(it).canAskAgain} )
    }
  }
}
