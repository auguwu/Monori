/**
 * Copyright (c) 2020 August
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

package dev.floofy.arisu.exposed

/**
 * Modified version of https://github.com/LorittaBot/Loritta/blob/development/loritta-discord/src/main/java/com/mrpowergamerbr/loritta/utils/exposed/array.kt
 * Licensed under AGPL 3.
 */

import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.statements.jdbc.JdbcConnectionImpl
import org.jetbrains.exposed.sql.transactions.TransactionManager

fun <T> Table.array(name: String, type: ColumnType): Column<Array<T>> =
        registerColumn(name, ArrayColumnType(type))

infix fun <T, S> ExpressionWithColumnType<T>.any(type: S): Op<Boolean> {
    if (type == null) return IsNullOp(this)

    return AnyOp(this, QueryParameter(type, columnType))
}

infix fun <T, S> ExpressionWithColumnType<T>.contains(array: Array<in S>): Op<Boolean> =
        ContainsOp(this, QueryParameter(array, columnType))

class ArrayColumnType(private val type: ColumnType): ColumnType() {
    override fun sqlType(): String = buildString {
        append(type.sqlType())
        append(" ARRAY")
    }

    override fun valueToDB(value: Any?): Any? = if (value is Array<*>) {
        val type = type.sqlType().split("(")[0]
        val connection = (TransactionManager.current().connection as JdbcConnectionImpl).connection

        connection.createArrayOf(type, value)
    } else {
        super.valueToDB(value)
    }

    override fun valueFromDB(value: Any): Any {
        if (value is java.sql.Array) return value.array
        if (value is Array<*>) return value

        error("Array is not supported in this database dialect.")
    }

    override fun notNullValueToDB(value: Any): Any {
        if (value is Array<*>) {
            if (value.isEmpty()) return "'{}'"

            val type = type.sqlType().split("(")[0]
            val connection = (TransactionManager.current().connection as JdbcConnectionImpl).connection
            return connection.createArrayOf(type, value) ?: error("Can't create non-nullable Array for $value")
        } else {
            return super.notNullValueToDB(value)
        }
    }
}

class AnyOp(val expr1: Expression<*>, val expr2: Expression<*>): Op<Boolean>() {

    override fun toQueryBuilder(queryBuilder: QueryBuilder) {
        if (expr2 is OrOp) queryBuilder.append("(").append(expr2).append(")")
        else queryBuilder.append(expr2)

        queryBuilder.append(" = ANY(")
        if (expr1 is OrOp) queryBuilder.append("(").append(expr1).append(")")
        else queryBuilder.append(expr1)

        queryBuilder.append(")")
    }
}

class ContainsOp(expr1: Expression<*>, expr2: Expression<*>): ComparisonOp(expr1, expr2, "@>")