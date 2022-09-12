/*
 * server component for the TimeLimit App
 * Copyright (C) 2019 - 2022 Jonas Lochmann
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, version 3 of the License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { UpdateInstalledAppsAction } from '../../../../action'
import { types } from '../../../../database/encryptedapplist'
import { generateVersionId } from '../../../../util/token'
import { Cache } from '../cache'

export async function dispatchUpdateInstalledApps ({ deviceId, action, cache }: {
  deviceId: string
  action: UpdateInstalledAppsAction
  cache: Cache
}) {
  async function upsert({ type, data }: { type: number, data: Buffer }) {
    await cache.database.encryptedAppList.upsert({
      familyId: cache.familyId,
      deviceId,
      type,
      version: generateVersionId(),
      data
    }, { transaction: cache.transaction })
  }

  if (action.base) {
    await upsert({ type: types.base, data: action.base })
  }

  if (action.diff) {
    await upsert({ type: types.diff, data: action.diff })
  }

  if (action.wipe) {
    await cache.database.app.destroy({
      where: {
        familyId: cache.familyId,
        deviceId
      },
      transaction: cache.transaction
    })

    cache.devicesWithModifiedInstalledApps.add(deviceId)
  }
}
